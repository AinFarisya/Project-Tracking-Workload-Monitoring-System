import { Router } from "express";
import { pool } from "../config/database.js";

const router = Router();


// =========================
// GET ALL ROLES
// =========================

router.get("/roles", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        role_id,
        role_name
      FROM roles
      ORDER BY role_id
    `);

    res.status(200).json({
      success: true,
      roles: result.rows,
    });

  } catch (error) {
    console.error("Error retrieving roles:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve roles",
    });
  }
});


// =========================
// GET ALL STATUSES
// =========================

router.get("/statuses", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        status_id,
        status_name
      FROM status
      ORDER BY status_id
    `);

    res.status(200).json({
      success: true,
      statuses: result.rows,
    });

  } catch (error) {
    console.error("Error retrieving statuses:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve statuses",
    });
  }
});


// =========================
// GET ALL PRIORITIES
// =========================

router.get("/priorities", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        priority_id,
        priority_level
      FROM priority
      ORDER BY priority_id
    `);

    res.status(200).json({
      success: true,
      priorities: result.rows,
    });

  } catch (error) {
    console.error("Error retrieving priorities:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve priorities",
    });
  }
});


export default router;