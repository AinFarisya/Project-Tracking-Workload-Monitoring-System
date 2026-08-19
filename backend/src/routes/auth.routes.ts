import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/database.js";

const router = Router();


// =========================
// LOGIN
// =========================

router.post("/login", async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;


    // -------------------------
    // VALIDATION
    // -------------------------

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }


    // -------------------------
    // FIND USER
    // -------------------------

    const result = await pool.query(
      `
      SELECT
        u.user_id,
        u.public_user_id,
        u.role_id,
        r.role_name,
        u.name,
        u.email,
        u.password_hash,
        u.must_change_password,
        u.temp_password,
        u.token_version,
        u.phone,
        u.department,
        u.profile_picture
      FROM users u

      LEFT JOIN roles r
        ON u.role_id = r.role_id

      WHERE LOWER(u.email) = LOWER($1)

      LIMIT 1
      `,
      [email.trim()]
    );


    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }


    const user = result.rows[0];


    // -------------------------
    // VERIFY PASSWORD
    // -------------------------

    const passwordMatches =
      await bcrypt.compare(
        password,
        user.password_hash
      );


    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }


    // -------------------------
    // JWT SECRET
    // -------------------------

    const jwtSecret =
      process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error(
        "JWT_SECRET is not configured"
      );
    }


    // -------------------------
    // GENERATE TOKEN
    // -------------------------

    const token = jwt.sign(
      {
        user_id: user.user_id,
        public_user_id:
          user.public_user_id,

        role_id:
          user.role_id,

        role_name:
          user.role_name,

        token_version:
          user.token_version ?? 0,
      },

      jwtSecret,

      {
        expiresIn: "8h",
      }
    );


    // -------------------------
    // REMOVE PASSWORD HASH
    // -------------------------

    delete user.password_hash;


    // -------------------------
    // RESPONSE
    // -------------------------

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user,
    });

  } catch (error) {

    console.error(
      "Login error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
});


export default router;