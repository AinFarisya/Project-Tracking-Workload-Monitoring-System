import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { pool } from "../config/database.js";


// =========================
// AUTH USER TYPE
// =========================

export interface AuthUser {
  user_id: number;
  public_user_id: string | null;
  role_id: number;
  role_name: string;
  token_version: number;
}


// =========================
// EXTEND EXPRESS REQUEST
// =========================

export interface AuthRequest extends Request {
  user?: AuthUser;
}


// =========================
// AUTHENTICATE TOKEN
// =========================

export async function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader =
      req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required",
      });
    }


    const token =
      authHeader.split(" ")[1];


    const jwtSecret =
      process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error(
        "JWT_SECRET is not configured"
      );
    }


    // -------------------------
    // VERIFY JWT
    // -------------------------

    const decoded =
      jwt.verify(
        token,
        jwtSecret
      ) as JwtPayload;


    const userId =
      Number(decoded.user_id);

    const tokenVersion =
      Number(
        decoded.token_version ?? 0
      );


    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }


    // -------------------------
    // CHECK USER STILL EXISTS
    // -------------------------

    const result = await pool.query(
      `
      SELECT
        u.user_id,
        u.public_user_id,
        u.role_id,
        r.role_name,
        u.token_version

      FROM users u

      LEFT JOIN roles r
        ON u.role_id = r.role_id

      WHERE u.user_id = $1

      LIMIT 1
      `,
      [userId]
    );


    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "User account no longer exists",
      });
    }


    const user =
      result.rows[0];


    // -------------------------
    // CHECK TOKEN VERSION
    // -------------------------

    if (
      Number(user.token_version ?? 0)
      !== tokenVersion
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Session is no longer valid. Please log in again.",
      });
    }


    // -------------------------
    // ATTACH USER TO REQUEST
    // -------------------------

    req.user = {
      user_id:
        user.user_id,

      public_user_id:
        user.public_user_id,

      role_id:
        user.role_id,

      role_name:
        user.role_name,

      token_version:
        Number(
          user.token_version ?? 0
        ),
    };


    next();

  } catch (error: any) {

    if (
      error?.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Session expired. Please log in again.",
      });
    }


    if (
      error?.name === "JsonWebTokenError"
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid authentication token",
      });
    }


    console.error(
      "Authentication error:",
      error
    );


    res.status(500).json({
      success: false,
      message:
        "Authentication failed",
    });
  }
}


// =========================
// ADMIN ONLY
// =========================

export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }


  if (
    req.user.role_name
      ?.toLowerCase()
      !== "admin"
  ) {
    return res.status(403).json({
      success: false,
      message:
        "Administrator access required",
    });
  }


  next();
}