import { Router } from "express";
import { pool } from "../config/database.js";
import {
  authenticateToken,
  requireAdmin,
} from "../middleware/auth.middleware.js";

const router = Router();


// =========================
// GET ALL PROJECT ASSIGNMENTS
// AUTHENTICATED USERS
// =========================

router.get(
  "/",
  authenticateToken,
  async (_req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          pa.id,
          pa.project_id,
          pa.user_id,

          p.project_id AS project_code,
          p.title AS project_title,

          u.public_user_id,
          u.name AS user_name,
          u.email AS user_email,

          r.role_name

        FROM project_assignments pa

        LEFT JOIN projects p
          ON pa.project_id = p.id

        LEFT JOIN users u
          ON pa.user_id = u.user_id

        LEFT JOIN roles r
          ON u.role_id = r.role_id

        ORDER BY pa.id
      `);

      res.status(200).json({
        success: true,
        count: result.rows.length,
        assignments: result.rows,
      });

    } catch (error) {
      console.error(
        "Error retrieving project assignments:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to retrieve project assignments",
      });
    }
  }
);


// =========================
// CREATE PROJECT ASSIGNMENT
// ADMIN ONLY
// =========================

router.post(
  "/",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const {
        project_id,
        user_id,
      } = req.body;


      // -------------------------
      // VALIDATION
      // -------------------------

      if (!project_id || !user_id) {
        return res.status(400).json({
          success: false,
          message:
            "Project and user are required",
        });
      }


      // -------------------------
      // CHECK PROJECT EXISTS
      // -------------------------

      const projectResult =
        await pool.query(
          `
          SELECT id
          FROM projects
          WHERE id = $1
          `,
          [project_id]
        );

      if (projectResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }


      // -------------------------
      // CHECK USER EXISTS
      // -------------------------

      const userResult =
        await pool.query(
          `
          SELECT user_id
          FROM users
          WHERE user_id = $1
          `,
          [user_id]
        );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }


      // -------------------------
      // PREVENT DUPLICATE
      // -------------------------

      const existingAssignment =
        await pool.query(
          `
          SELECT id
          FROM project_assignments
          WHERE project_id = $1
            AND user_id = $2
          `,
          [
            project_id,
            user_id,
          ]
        );

      if (
        existingAssignment.rows.length > 0
      ) {
        return res.status(409).json({
          success: false,
          message:
            "This user is already assigned to this project",
        });
      }


      // -------------------------
      // CREATE ASSIGNMENT
      // -------------------------

      const result =
        await pool.query(
          `
          INSERT INTO project_assignments (
            project_id,
            user_id
          )
          VALUES ($1, $2)

          RETURNING
            id,
            project_id,
            user_id
          `,
          [
            project_id,
            user_id,
          ]
        );


      res.status(201).json({
        success: true,
        message:
          "User assigned to project successfully",
        assignment:
          result.rows[0],
      });

    } catch (error: any) {

      if (error?.code === "23503") {
        return res.status(400).json({
          success: false,
          message:
            "Invalid project or user",
        });
      }


      if (error?.code === "23505") {
        return res.status(409).json({
          success: false,
          message:
            "This user is already assigned to this project",
        });
      }


      console.error(
        "Error creating project assignment:",
        error
      );


      res.status(500).json({
        success: false,
        message:
          "Failed to create project assignment",
      });
    }
  }
);


// =========================
// DELETE PROJECT ASSIGNMENT
// ADMIN ONLY
// =========================

router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const id =
        Number(req.params.id);


      if (!Number.isInteger(id)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid assignment ID",
        });
      }


      const result =
        await pool.query(
          `
          DELETE FROM project_assignments
          WHERE id = $1

          RETURNING
            id,
            project_id,
            user_id
          `,
          [id]
        );


      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            "Project assignment not found",
        });
      }


      res.status(200).json({
        success: true,
        message:
          "Project assignment deleted successfully",
        assignment:
          result.rows[0],
      });

    } catch (error) {

      console.error(
        "Error deleting project assignment:",
        error
      );


      res.status(500).json({
        success: false,
        message:
          "Failed to delete project assignment",
      });
    }
  }
);


export default router;