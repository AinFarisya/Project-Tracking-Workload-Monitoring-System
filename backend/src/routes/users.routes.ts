import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../config/database.js";
import {
  authenticateToken,
  requireAdmin,
} from "../middleware/auth.middleware.js";

const router = Router();


// =========================
// GET ALL USERS
// =========================

router.get("/", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.user_id,
        u.public_user_id,
        u.role_id,
        r.role_name,
        u.name,
        u.email,
        u.created_at,
        u.must_change_password,
        u.temp_password,
        u.token_version,
        u.phone,
        u.department,
        u.profile_picture
      FROM users u
      LEFT JOIN roles r
        ON u.role_id = r.role_id
      ORDER BY u.user_id
    `);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      users: result.rows,
    });

  } catch (error) {
    console.error("Error retrieving users:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve users",
    });
  }
});


// =========================
// CREATE USER
// ADMIN ONLY
// =========================

router.post(
  "/",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    const client = await pool.connect();

    let transactionStarted = false;

    try {
      const {
        role_id,
        name,
        email,
        password,
        phone,
        department,
        profile_picture,
        must_change_password,
        temp_password,
      } = req.body;


      // -------------------------
      // VALIDATION
      // -------------------------

      if (!name || name.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "User name is required",
        });
      }

      if (!email || email.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      if (!password || password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must contain at least 6 characters",
        });
      }


      // -------------------------
      // CHECK EMAIL
      // -------------------------

      const existingUser = await client.query(
        `
        SELECT user_id
        FROM users
        WHERE LOWER(email) = LOWER($1)
        `,
        [email.trim()]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: "A user with this email already exists",
        });
      }


      // -------------------------
      // HASH PASSWORD
      // -------------------------

      const passwordHash =
        await bcrypt.hash(password, 10);


      // -------------------------
      // START TRANSACTION
      // -------------------------

      await client.query("BEGIN");

      transactionStarted = true;


      // -------------------------
      // CREATE USER
      // -------------------------

      const insertResult = await client.query(
        `
        INSERT INTO users (
          role_id,
          name,
          email,
          password_hash,
          must_change_password,
          temp_password,
          phone,
          department,
          profile_picture
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9
        )
        RETURNING user_id
        `,
        [
          role_id ?? 2,
          name.trim(),
          email.trim().toLowerCase(),
          passwordHash,
          must_change_password ?? true,
          temp_password ?? true,
          phone ?? null,
          department ?? null,
          profile_picture ?? null,
        ]
      );


      const userId =
        insertResult.rows[0].user_id;


      // -------------------------
      // GENERATE PUBLIC USER ID
      // Example: USR-000001
      // -------------------------

      const publicUserId =
        `USR-${String(userId).padStart(6, "0")}`;


      // -------------------------
      // UPDATE PUBLIC USER ID
      // -------------------------

      const result = await client.query(
        `
        UPDATE users
        SET public_user_id = $1
        WHERE user_id = $2

        RETURNING
          user_id,
          public_user_id,
          role_id,
          name,
          email,
          created_at,
          must_change_password,
          temp_password,
          token_version,
          phone,
          department,
          profile_picture
        `,
        [
          publicUserId,
          userId,
        ]
      );


      // -------------------------
      // COMMIT TRANSACTION
      // -------------------------

      await client.query("COMMIT");

      transactionStarted = false;


      res.status(201).json({
        success: true,
        message: "User created successfully",
        user: result.rows[0],
      });

    } catch (error: any) {

      // -------------------------
      // ROLLBACK SAFELY
      // -------------------------

      if (transactionStarted) {
        try {
          await client.query("ROLLBACK");
        } catch (rollbackError) {
          console.error(
            "Rollback failed:",
            rollbackError
          );
        }
      }


      console.error(
        "Error creating user:",
        error
      );


      if (error?.code === "23503") {
        return res.status(400).json({
          success: false,
          message: "Invalid role selected",
        });
      }


      if (error?.code === "23505") {
        return res.status(409).json({
          success: false,
          message:
            "A user with this information already exists",
        });
      }


      res.status(500).json({
        success: false,
        message: "Failed to create user",
      });

    } finally {
      client.release();
    }
  }
);


// =========================
// UPDATE USER
// ADMIN ONLY
// =========================

router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID",
        });
      }


      const {
        role_id,
        name,
        email,
        password,
        phone,
        department,
        profile_picture,
        must_change_password,
        temp_password,
      } = req.body;


      // -------------------------
      // CHECK USER EXISTS
      // -------------------------

      const existingUser = await pool.query(
        `
        SELECT user_id
        FROM users
        WHERE user_id = $1
        `,
        [id]
      );

      if (existingUser.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }


      // -------------------------
      // CHECK DUPLICATE EMAIL
      // -------------------------

      if (email) {
        const duplicateEmail =
          await pool.query(
            `
            SELECT user_id
            FROM users
            WHERE LOWER(email) = LOWER($1)
              AND user_id <> $2
            `,
            [
              email.trim(),
              id,
            ]
          );

        if (duplicateEmail.rows.length > 0) {
          return res.status(409).json({
            success: false,
            message:
              "Another user already uses this email",
          });
        }
      }


      // -------------------------
      // OPTIONAL PASSWORD CHANGE
      // -------------------------

      let passwordHash = null;

      if (password) {
        if (password.length < 6) {
          return res.status(400).json({
            success: false,
            message:
              "Password must contain at least 6 characters",
          });
        }

        passwordHash =
          await bcrypt.hash(
            password,
            10
          );
      }


      // -------------------------
      // UPDATE USER
      // -------------------------

      const result = await pool.query(
        `
        UPDATE users
        SET
          role_id =
            COALESCE($1, role_id),

          name =
            COALESCE($2, name),

          email =
            COALESCE($3, email),

          password_hash =
            COALESCE($4, password_hash),

          phone =
            COALESCE($5, phone),

          department =
            COALESCE($6, department),

          profile_picture =
            COALESCE($7, profile_picture),

          must_change_password =
            COALESCE(
              $8,
              must_change_password
            ),

          temp_password =
            COALESCE(
              $9,
              temp_password
            ),

          token_version =
            CASE
              WHEN $4::text IS NOT NULL
              THEN COALESCE(token_version, 0) + 1
              ELSE COALESCE(token_version, 0)
            END

        WHERE user_id = $10

        RETURNING
          user_id,
          public_user_id,
          role_id,
          name,
          email,
          created_at,
          must_change_password,
          temp_password,
          token_version,
          phone,
          department,
          profile_picture
        `,
        [
          role_id ?? null,
          name?.trim() ?? null,
          email?.trim().toLowerCase() ?? null,
          passwordHash,
          phone ?? null,
          department ?? null,
          profile_picture ?? null,
          must_change_password ?? null,
          temp_password ?? null,
          id,
        ]
      );


      res.status(200).json({
        success: true,
        message: "User updated successfully",
        user: result.rows[0],
      });

    } catch (error: any) {

      if (error?.code === "23503") {
        return res.status(400).json({
          success: false,
          message: "Invalid role selected",
        });
      }

      if (error?.code === "23505") {
        return res.status(409).json({
          success: false,
          message:
            "A user with this information already exists",
        });
      }

      console.error(
        "Error updating user:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Failed to update user",
      });
    }
  }
);


// =========================
// DELETE USER
// ADMIN ONLY
// =========================

router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID",
        });
      }


      const result = await pool.query(
        `
        DELETE FROM users
        WHERE user_id = $1

        RETURNING
          user_id,
          public_user_id,
          name,
          email
        `,
        [id]
      );


      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }


      res.status(200).json({
        success: true,
        message: "User deleted successfully",
        user: result.rows[0],
      });

    } catch (error: any) {

      if (error?.code === "23503") {
        return res.status(409).json({
          success: false,
          message:
            "User cannot be deleted because tasks, projects or other records are still assigned to this user.",
        });
      }

      console.error(
        "Error deleting user:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Failed to delete user",
      });
    }
  }
);


export default router;