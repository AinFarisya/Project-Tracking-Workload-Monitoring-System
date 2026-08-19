import "dotenv/config";

import express from "express";
import cors from "cors";

import usersRouter from "./routes/users.routes.js";
import projectsRouter from "./routes/projects.routes.js";
import tasksRouter from "./routes/tasks.routes.js";
import referenceRouter from "./routes/reference.routes.js";
import authRouter from "./routes/auth.routes.js";
import projectAssignmentsRouter from "./routes/project-assignments.routes.js";
import projectMilestonesRouter from "./routes/project-milestones.routes.js";

import {
  testDatabaseConnection,
} from "./config/database.js";

import {
  authenticateToken,
  AuthRequest,
} from "./middleware/auth.middleware.js";


// =========================
// APP CONFIG
// =========================

const app = express();

const PORT =
  Number(process.env.PORT) || 5000;


// =========================
// MIDDLEWARE
// =========================

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

app.use(express.json());


// =========================
// API ROUTES
// =========================

app.use(
  "/api/users",
  usersRouter
);

app.use(
  "/api/projects",
  projectsRouter
);

app.use(
  "/api/tasks",
  tasksRouter
);

app.use(
  "/api/reference",
  referenceRouter
);

app.use(
  "/api/auth",
  authRouter
);

app.use(
  "/api/project-assignments",
  projectAssignmentsRouter
);

app.use(
  "/api/project-milestones",
  projectMilestonesRouter
);


// =========================
// TEST PROTECTED ROUTE
// =========================

app.get(
  "/api/protected",
  authenticateToken,
  (req: AuthRequest, res) => {

    res.status(200).json({
      success: true,
      message:
        "Protected route accessed successfully",
      user: req.user,
    });

  }
);


// =========================
// HEALTH CHECK
// =========================

app.get(
  "/api/health",
  (_req, res) => {

    res.status(200).json({
      success: true,
      message:
        "Project Tracking API is running",
    });

  }
);


// =========================
// START SERVER
// =========================

async function startServer() {

  try {

    await testDatabaseConnection();

    app.listen(
      PORT,
      () => {

        console.log(
          `Server running on http://localhost:${PORT}`
        );

      }
    );

  } catch (error) {

    console.error(
      "Failed to connect to PostgreSQL."
    );

    console.error(error);

    process.exit(1);

  }
}


startServer();