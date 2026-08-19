import { Router } from "express";
import { pool } from "../config/database.js";

const router = Router();


// =========================
// GET ALL TASKS
// =========================

router.get("/", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        t.*,

        p.project_id AS project_code,
        p.title AS project_title,

        assigned.name AS assigned_to_name,
        assigned.email AS assigned_to_email,

        reporter.name AS reported_by_name,
        reporter.email AS reported_by_email,

        s.status_name,
        pr.priority_level

      FROM tasks t

      LEFT JOIN projects p
        ON t.project_id = p.id

      LEFT JOIN users assigned
        ON t.assigned_to_user_id = assigned.user_id

      LEFT JOIN users reporter
        ON t.reported_by_user_id = reporter.user_id

      LEFT JOIN status s
        ON t.status_id = s.status_id

      LEFT JOIN priority pr
        ON t.priority_id = pr.priority_id

      ORDER BY t.task_id
    `);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      tasks: result.rows,
    });

  } catch (error) {
    console.error("Error retrieving tasks:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve tasks",
    });
  }
});


// =========================
// CREATE TASK
// =========================

router.post("/", async (req, res) => {
  try {
    const {
      title,
      assigned_to_user_id,
      reported_by_user_id,
      status_id,
      priority_id,
      due_date,
      project_id,
    } = req.body;


    // -------------------------
    // VALIDATION
    // -------------------------

    if (!title || title.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Task title is required",
      });
    }

    if (!project_id) {
      return res.status(400).json({
        success: false,
        message: "Project is required",
      });
    }


    const finalStatusId = status_id ?? 1;
    const finalPriorityId = priority_id ?? 4;


    const result = await pool.query(
      `
      INSERT INTO tasks (
        title,
        assigned_to_user_id,
        reported_by_user_id,
        status_id,
        priority_id,
        due_date,
        completion_date,
        project_id
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        CASE
          WHEN $4 = 3
          THEN CURRENT_DATE
          ELSE NULL
        END,
        $7
      )
      RETURNING *
      `,
      [
        title.trim(),
        assigned_to_user_id ?? null,
        reported_by_user_id ?? null,
        finalStatusId,
        finalPriorityId,
        due_date ?? null,
        project_id,
      ]
    );


    res.status(201).json({
      success: true,
      message: "Task created successfully",
      task: result.rows[0],
    });

  } catch (error: any) {

    if (error.code === "23503") {
      return res.status(400).json({
        success: false,
        message:
          "Invalid project, user, status or priority reference.",
      });
    }

    console.error("Error creating task:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create task",
    });
  }
});


// =========================
// UPDATE TASK
// =========================

router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }


    const {
      title,
      assigned_to_user_id,
      reported_by_user_id,
      status_id,
      priority_id,
      due_date,
      project_id,
    } = req.body;


    const result = await pool.query(
      `
      UPDATE tasks
      SET
        title =
          COALESCE($1, title),

        assigned_to_user_id =
          COALESCE($2, assigned_to_user_id),

        reported_by_user_id =
          COALESCE($3, reported_by_user_id),

        status_id =
          COALESCE($4, status_id),

        priority_id =
          COALESCE($5, priority_id),

        due_date =
          COALESCE($6, due_date),

        project_id =
          COALESCE($7, project_id),

        completion_date =
          CASE
            WHEN COALESCE($4, status_id) = 3
              THEN COALESCE(completion_date, CURRENT_DATE)
            ELSE NULL
          END

      WHERE task_id = $8

      RETURNING *
      `,
      [
        title ?? null,
        assigned_to_user_id ?? null,
        reported_by_user_id ?? null,
        status_id ?? null,
        priority_id ?? null,
        due_date ?? null,
        project_id ?? null,
        id,
      ]
    );


    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }


    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      task: result.rows[0],
    });

  } catch (error: any) {

    if (error.code === "23503") {
      return res.status(400).json({
        success: false,
        message:
          "Invalid project, user, status or priority reference.",
      });
    }

    console.error("Error updating task:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update task",
    });
  }
});


// =========================
// DELETE TASK
// =========================

router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }


    const result = await pool.query(
      `
      DELETE FROM tasks
      WHERE task_id = $1
      RETURNING *
      `,
      [id]
    );


    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }


    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
      task: result.rows[0],
    });

  } catch (error) {
    console.error("Error deleting task:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete task",
    });
  }
});


export default router;