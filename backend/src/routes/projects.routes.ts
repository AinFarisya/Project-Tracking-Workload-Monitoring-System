import { Router } from "express";
import { pool } from "../config/database.js";

const router = Router();


// =========================
// GET ALL PROJECTS
// =========================

router.get("/", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.*,
        s.status_name,
        pr.priority_level
      FROM projects p
      LEFT JOIN status s
        ON p.status_id = s.status_id
      LEFT JOIN priority pr
        ON p.priority_id = pr.priority_id
      ORDER BY p.id
    `);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      projects: result.rows,
    });

  } catch (error) {
    console.error("Error retrieving projects:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve projects",
    });
  }
});


// =========================
// CREATE PROJECT
// =========================

router.post("/", async (req, res) => {
  try {
    const {
      title,
      description,
      due_date,
      priority_id,
      status_id,
      approval_status,
      documents,
    } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Project title is required",
      });
    }

    const projectId = `PRJ-${Date.now()}`;

    const finalPriorityId = priority_id ?? 4;
    const finalStatusId = status_id ?? 1;
    const finalApprovalStatus = approval_status ?? "Pending";

    const finalDocuments =
      Array.isArray(documents)
        ? documents
        : [];

    const result = await pool.query(
      `
      INSERT INTO projects (
        project_id,
        title,
        description,
        due_date,
        documents,
        approval_status,
        priority_id,
        status_id
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5::jsonb,
        $6,
        $7,
        $8
      )
      RETURNING *
      `,
      [
        projectId,
        title.trim(),
        description ?? null,
        due_date ?? null,
        JSON.stringify(finalDocuments),
        finalApprovalStatus,
        finalPriorityId,
        finalStatusId,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      project: result.rows[0],
    });

  } catch (error) {
    console.error("Error creating project:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create project",
    });
  }
});


// =========================
// UPDATE PROJECT
// =========================

router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    const {
      title,
      description,
      due_date,
      priority_id,
      status_id,
      approval_status,
      documents,
    } = req.body;

    const documentsValue =
      Array.isArray(documents)
        ? JSON.stringify(documents)
        : null;

    const result = await pool.query(
      `
      UPDATE projects
      SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        due_date = COALESCE($3, due_date),
        priority_id = COALESCE($4, priority_id),
        status_id = COALESCE($5, status_id),
        approval_status = COALESCE($6, approval_status),

        documents =
          CASE
            WHEN $7::jsonb IS NOT NULL
            THEN $7::jsonb
            ELSE documents
          END,

        completed_at =
          CASE
            WHEN COALESCE($5, status_id) = 3
              THEN COALESCE(completed_at, NOW())
            ELSE NULL
          END

      WHERE id = $8

      RETURNING *
      `,
      [
        title ?? null,
        description ?? null,
        due_date ?? null,
        priority_id ?? null,
        status_id ?? null,
        approval_status ?? null,
        documentsValue,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      project: result.rows[0],
    });

  } catch (error) {
    console.error("Error updating project:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update project",
    });
  }
});


// =========================
// DELETE PROJECT
// =========================

router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    const result = await pool.query(
      `
      DELETE FROM projects
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
      project: result.rows[0],
    });

  } catch (error: any) {

    // Project still has linked tasks,
    // assignments or milestones.
    if (error.code === "23503") {
      return res.status(409).json({
        success: false,
        message:
          "Project cannot be deleted because related records still exist.",
      });
    }

    console.error("Error deleting project:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete project",
    });
  }
});


export default router;