# Project Tracking & Workload Monitoring System

A full-stack project and workload management system developed to support task assignment, project monitoring, workload visibility, milestone tracking, and role-based access for administrators and users.

The system was designed to improve project visibility and replace manual tracking processes with a centralized web-based platform.

---

## Overview

The Project Tracking & Workload Monitoring System enables administrators to manage users, projects, tasks, priorities, statuses, project assignments, and milestones through a centralized dashboard.

The platform also supports employee workload monitoring and project timeline tracking using milestone and Gantt-style views.

The backend is connected to a PostgreSQL database through an Express.js API, while the frontend provides an interactive interface for system users.

---

## Key Features

- User authentication with JWT
- Role-based access for Admin and User
- User management
- Project creation and management
- Task creation, assignment, update, and deletion
- Task priority and status management
- Project-to-user assignment
- Project milestone management
- Gantt-style project timeline tracking
- Employee workload monitoring
- Project and task summary dashboards
- PostgreSQL database integration
- Protected API routes
- Password hashing using bcrypt
- Session handling with localStorage / sessionStorage

---

## System Modules

### Admin

Administrators can:

- Manage system users
- Create and update projects
- Assign users to projects
- Create and manage tasks
- Update task status and priority
- Monitor employee workload
- View project and task summaries
- Manage project milestones
- View team Gantt timelines
- Update administrator profile settings

### User

Users can access project- and task-related information based on their assigned responsibilities.

The system architecture supports role-based access so different users can receive different system permissions and dashboard views.

---

## Technology Stack

### Frontend

- React
- TypeScript
- Vite
- HTML
- CSS
- JavaScript
- Lucide React

### Backend

- Node.js
- Express.js
- TypeScript
- REST API

### Database

- PostgreSQL
- pgAdmin

### Authentication & Security

- JSON Web Token (JWT)
- bcrypt password hashing
- Protected API routes
- Role-based authorization
- Environment variables for sensitive configuration

---

## Backend API

The backend provides REST API endpoints for the main system modules.

```text
/api/auth
/api/users
/api/projects
/api/tasks
/api/reference
/api/project-assignments
/api/project-milestones
