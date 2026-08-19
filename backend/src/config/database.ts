import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

export async function testDatabaseConnection() {
  const result = await pool.query(
    "SELECT NOW() AS current_time"
  );

  console.log("PostgreSQL connected successfully.");
  console.log(
    "Database time:",
    result.rows[0].current_time
  );
}