import { Router } from "express";
import { pool } from "../config/database.js";
import {
  authenticateToken,
  requireAdmin,
} from "../middleware/auth.middleware.js";

const router = Router();


// =========================
// GET ALL MILESTONES
// =========================

router.get(
  "/",
  authenticateToken,
  async (_req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          pm.milestone_id,
          pm.project_id,
          p.project_id AS project_code,
          p.title AS project_title,

          pm.title,
          pm.description,
          pm.start_date,
          pm.end_date,

          pm.status_id,
          s.status_name,

          pm.priority_id,
          pr.priority_level,

          pm.created_at

        FROM project_milestones pm

        LEFT JOIN projects p
          ON pm.project_id = p.id

        LEFT JOIN status s
          ON pm.status_id = s.status_id

        LEFT JOIN priority pr
          ON pm.priority_id = pr.priority_id

        ORDER BY
          pm.start_date NULLS LAST,
          pm.milestone_id
      `);

      res.status(200).json({
        success: true,
        count: result.rows.length,
        milestones: result.rows,
      });

    } catch (error) {
      console.error(
        "Error retrieving milestones:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Failed to retrieve milestones",
      });
    }
  }
);


// =========================
// GET MILESTONES BY PROJECT
// =========================

router.get(
  "/project/:projectId",
  authenticateToken,
  async (req, res) => {
    try {
      const projectId =
        Number(req.params.projectId);

      if (!Number.isInteger(projectId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid project ID",
        });
      }

      const result = await pool.query(
        `
        SELECT
          pm.milestone_id,
          pm.project_id,
          p.project_id AS project_code,
          p.title AS project_title,

          pm.title,
          pm.description,
          pm.start_date,
          pm.end_date,

          pm.status_id,
          s.status_name,

          pm.priority_id,
          pr.priority_level,

          pm.created_at

        FROM project_milestones pm

        LEFT JOIN projects p
          ON pm.project_id = p.id

        LEFT JOIN status s
          ON pm.status_id = s.status_id

        LEFT JOIN priority pr
          ON pm.priority_id = pr.priority_id

        WHERE pm.project_id = $1

        ORDER BY
          pm.start_date NULLS LAST,
          pm.milestone_id
        `,
        [projectId]
      );

      res.status(200).json({
        success: true,
        count: result.rows.length,
        milestones: result.rows,
      });

    } catch (error) {
      console.error(
        "Error retrieving project milestones:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to retrieve project milestones",
      });
    }
  }
);


// =========================
// CREATE MILESTONE
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
        title,
        description,
        start_date,
        end_date,
        status_id,
        priority_id,
      } = req.body;


      // -------------------------
      // VALIDATION
      // -------------------------

      if (!project_id) {
        return res.status(400).json({
          success: false,
          message: "Project is required",
        });
      }

      if (!title || title.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Milestone title is required",
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
      // DATE VALIDATION
      // -------------------------

      if (
        start_date &&
        end_date &&
        new Date(end_date) <
          new Date(start_date)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "End date cannot be earlier than start date",
        });
      }


      // -------------------------
      // CREATE
      // -------------------------

      const result = await pool.query(
        `
        INSERT INTO project_milestones (
          project_id,
          title,
          description,
          start_date,
          end_date,
          status_id,
          priority_id
        )

        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7
        )

        RETURNING
          milestone_id,
          project_id,
          title,
          description,
          start_date,
          end_date,
          status_id,
          priority_id,
          created_at
        `,
        [
          project_id,
          title.trim(),
          description ?? null,
          start_date ?? null,
          end_date ?? null,
          status_id ?? null,
          priority_id ?? null,
        ]
      );


      res.status(201).json({
        success: true,
        message:
          "Milestone created successfully",
        milestone: result.rows[0],
      });

    } catch (error: any) {

      if (error?.code === "23503") {
        return res.status(400).json({
          success: false,
          message:
            "Invalid project, status or priority",
        });
      }

      console.error(
        "Error creating milestone:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to create milestone",
      });
    }
  }
);


// =========================
// UPDATE MILESTONE
// ADMIN ONLY
// =========================

router.put(
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
            "Invalid milestone ID",
        });
      }


      const existingResult =
        await pool.query(
          `
          SELECT *
          FROM project_milestones
          WHERE milestone_id = $1
          `,
          [id]
        );

      if (existingResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            "Milestone not found",
        });
      }


      const existing =
        existingResult.rows[0];


      const {
        project_id,
        title,
        description,
        start_date,
        end_date,
        status_id,
        priority_id,
      } = req.body;


      const finalStartDate =
        start_date ??
        existing.start_date;

      const finalEndDate =
        end_date ??
        existing.end_date;


      if (
        finalStartDate &&
        finalEndDate &&
        new Date(finalEndDate) <
          new Date(finalStartDate)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "End date cannot be earlier than start date",
        });
      }


      const result = await pool.query(
        `
        UPDATE project_milestones
        SET
          project_id =
            COALESCE($1, project_id),

          title =
            COALESCE($2, title),

          description =
            COALESCE($3, description),

          start_date =
            COALESCE($4, start_date),

          end_date =
            COALESCE($5, end_date),

          status_id =
            COALESCE($6, status_id),

          priority_id =
            COALESCE($7, priority_id)

        WHERE milestone_id = $8

        RETURNING
          milestone_id,
          project_id,
          title,
          description,
          start_date,
          end_date,
          status_id,
          priority_id,
          created_at
        `,
        [
          project_id ?? null,
          title?.trim() ?? null,
          description ?? null,
          start_date ?? null,
          end_date ?? null,
          status_id ?? null,
          priority_id ?? null,
          id,
        ]
      );


      res.status(200).json({
        success: true,
        message:
          "Milestone updated successfully",
        milestone: result.rows[0],
      });

    } catch (error: any) {

      if (error?.code === "23503") {
        return res.status(400).json({
          success: false,
          message:
            "Invalid project, status or priority",
        });
      }


      console.error(
        "Error updating milestone:",
        error
      );


      res.status(500).json({
        success: false,
        message:
          "Failed to update milestone",
      });
    }
  }
);


// =========================
// DELETE MILESTONE
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
            "Invalid milestone ID",
        });
      }


      const result =
        await pool.query(
          `
          DELETE FROM project_milestones
          WHERE milestone_id = $1

          RETURNING
            milestone_id,
            project_id,
            title
          `,
          [id]
        );


      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            "Milestone not found",
        });
      }


      res.status(200).json({
        success: true,
        message:
          "Milestone deleted successfully",
        milestone:
          result.rows[0],
      });

    } catch (error) {

      console.error(
        "Error deleting milestone:",
        error
      );


      res.status(500).json({
        success: false,
        message:
          "Failed to delete milestone",
      });
    }
  }
);


export default router;