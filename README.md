# Project Tracking & Workload Monitoring System

A full-stack **project tracking and workload monitoring platform** designed to help administrators manage users, projects, tasks, assignments, milestones, priorities, and employee workload through a centralized web-based system.

This project was developed during my **IT Internship at Celestica GBS Penang (M) Sdn. Bhd.**

> 🚧 **Project Status:** System development has been completed. Deployment and production rollout are being handled internally by the Celestica team.

---

## Project Purpose

Project and task monitoring is often handled using spreadsheets or manually maintained tracking files, which can make it difficult to monitor project progress, employee workload, task priorities, and overall status efficiently.

This system provides a centralized platform for managing project-related information by supporting:

* Project and task management
* Employee workload monitoring
* User and role management
* Project-to-user assignments
* Project milestone tracking
* Status and priority management
* Gantt-style timeline visualisation
* Role-based system access

The goal is to improve project visibility, reduce reliance on manual tracking, and provide a clearer overview of employee workload and project progress.

---

## Key Features

### User & Role Management

* Admin and user role support
* User creation and management
* User profile information
* Department and contact information
* Role-based access control
* Secure password handling
* Temporary password support
* First-login password change support through backend fields

### Authentication & Security

* Email and password login
* Password hashing using bcrypt
* JSON Web Token (JWT) authentication
* Protected backend routes
* Role-based permissions
* Authentication token management
* Session handling using localStorage or sessionStorage
* Environment variables for sensitive configuration

### Project Management

* Create and manage projects
* Update project information
* Delete projects
* Assign project priority
* Assign project status
* Track project completion
* Maintain project descriptions and due dates

### Task Management

* Create tasks
* Assign tasks to users
* Record task reporter
* Update task status
* Update task priority
* Set task due dates
* Track task completion
* Delete tasks
* Associate tasks with projects

### Project Assignment

* Assign users to projects
* Support multiple project-user relationships
* View assigned users for each project
* Maintain project assignments in PostgreSQL

### Project Milestones

* Create project milestones
* Set milestone start dates
* Set milestone end dates
* Update milestone status
* Update milestone priority
* Delete milestones
* Associate milestones with projects

### Workload Monitoring

* View employee task assignments
* Monitor task status
* Review employee workload
* Display task priority distribution
* Display project and task summaries
* Support dashboard-based monitoring

### Gantt & Timeline Tracking

* Project milestone timeline
* Start and end date visualisation
* Task and milestone progress tracking
* Project timeline monitoring
* Team-level Gantt-style view

---

## Technology Stack

### Frontend

* React
* TypeScript
* JavaScript
* HTML
* CSS
* Vite
* Lucide React

### Backend

* Node.js
* Express.js
* TypeScript
* REST API

### Authentication & Security

* JSON Web Token (JWT)
* bcrypt
* Protected Express routes
* Role-based authorization
* Environment variables

### Database

* PostgreSQL
* pgAdmin

### Development Tools

* Visual Studio Code
* Git
* GitHub
* pgAdmin
* PowerShell

---

## Repository Structure

```text
Project-Tracking-Workload-Monitoring-System/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts
│   │   │
│   │   ├── middleware/
│   │   │   └── auth.middleware.ts
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── users.routes.ts
│   │   │   ├── projects.routes.ts
│   │   │   ├── tasks.routes.ts
│   │   │   ├── reference.routes.ts
│   │   │   ├── project-assignments.routes.ts
│   │   │   └── project-milestones.routes.ts
│   │   │
│   │   └── server.ts
│   │
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   └── .gitignore
│
├── src/
│   ├── components/
│   │   ├── admin/
│   │   ├── user/
│   │   ├── ui/
│   │   ├── Login.tsx
│   │   └── Login.css
│   │
│   ├── styles/
│   │   └── globals.css
│   │
│   ├── utils/
│   │   └── excelExport.ts
│   │
│   ├── App.tsx
│   ├── main.tsx
│   ├── css.d.ts
│   └── vite-env.d.ts
│
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── vite.config.ts
└── README.md
```

---

## System Workflow

1. User opens the Project Tracking & Workload Monitoring System.
2. User enters an email address and password.
3. The frontend sends the login request to the Express backend.
4. The backend verifies the user's credentials.
5. Password validation is performed using bcrypt.
6. A JWT authentication token is generated after successful login.
7. The frontend stores the authenticated session.
8. The user accesses system features according to their assigned role.
9. Admin users can manage users, projects, tasks, project assignments, and milestones.
10. Project and task information is stored in PostgreSQL.
11. Dashboard components display project progress, task status, priorities, and employee workload.
12. Project milestones are used to support timeline and Gantt-style monitoring.

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
```

### Authentication

```text
POST /api/auth/login
```

### Users

```text
GET    /api/users
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id
```

### Projects

```text
GET    /api/projects
POST   /api/projects
PUT    /api/projects/:id
DELETE /api/projects/:id
```

### Tasks

```text
GET    /api/tasks
POST   /api/tasks
PUT    /api/tasks/:id
DELETE /api/tasks/:id
```

### Project Assignments

```text
GET    /api/project-assignments
POST   /api/project-assignments
DELETE /api/project-assignments/:id
```

### Project Milestones

```text
GET    /api/project-milestones
POST   /api/project-milestones
PUT    /api/project-milestones/:id
DELETE /api/project-milestones/:id
```

### Reference Data

Reference APIs are used to retrieve values such as:

* Roles
* Statuses
* Priorities

---

## Authentication Flow

```text
User enters email and password
        ↓
React frontend
        ↓
POST /api/auth/login
        ↓
Express backend
        ↓
PostgreSQL user lookup
        ↓
bcrypt password verification
        ↓
JWT token generated
        ↓
Token returned to frontend
        ↓
Frontend stores authenticated session
        ↓
Protected system features become accessible
```

---

## Project Assignment Flow

```text
Admin selects project
        ↓
Admin selects user
        ↓
POST /api/project-assignments
        ↓
Assignment saved in PostgreSQL
        ↓
User becomes associated with the selected project
```

---

## Milestone & Gantt Flow

```text
Project
   ↓
Project Milestones
   ↓
Start Date + End Date
   ↓
Status + Priority
   ↓
Timeline Data
   ↓
Gantt / Project Progress Visualisation
```

This allows project progress and important milestones to be monitored in a more visual and structured way.

---

## Database

The system uses PostgreSQL as the main application database.

The database stores information including:

* Users
* Roles
* Projects
* Tasks
* Statuses
* Priorities
* Project assignments
* Project milestones

Relationships between these tables allow users, projects, tasks, statuses, priorities, and milestones to be connected throughout the system.

---

## Running the Project Locally

### 1. Clone the Repository

```bash
git clone https://github.com/AinFarisya/Project-Tracking-Workload-Monitoring-System.git
cd Project-Tracking-Workload-Monitoring-System
```

---

### 2. Frontend Setup

Install the frontend dependencies:

```bash
npm install --legacy-peer-deps
```

Start the React development server:

```bash
npm run dev
```

The frontend currently runs at:

```text
http://localhost:3000/
```

---

### 3. Backend Setup

Open another terminal and navigate to:

```bash
cd backend
```

Install the required backend packages:

```bash
npm install
```

Create a `.env` file inside the `backend` directory.

Example:

```env
PORT=5000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password

JWT_SECRET=your_jwt_secret
```

Start the Express backend:

```bash
npm run dev
```

The backend will normally run at:

```text
http://localhost:5000/
```

The API health endpoint can be checked using:

```text
http://localhost:5000/api/health
```

---

## Important Security Note

Sensitive and machine-specific files are intentionally excluded from this public repository using `.gitignore`.

These include:

```text
.env
backend/.env
node_modules/
backend/node_modules/
dist/
build/
*.log
```

Database credentials, JWT secrets, passwords, and other sensitive configuration are **not stored in the public source code**.

Users who clone the repository should create their own local `backend/.env` file before running the backend.

---

## Main Project Files

### `backend/src/server.ts`

Initialises the Express server, middleware, CORS configuration, API routes, health endpoint, and PostgreSQL connection.

### `backend/src/config/database.ts`

Configures the PostgreSQL connection pool and database connectivity.

### `backend/src/routes/auth.routes.ts`

Handles authentication requests including user login and JWT generation.

### `backend/src/middleware/auth.middleware.ts`

Validates JWT authentication tokens and protects restricted backend routes.

### `backend/src/routes/users.routes.ts`

Handles user management operations including user creation, retrieval, updates, and deletion.

### `backend/src/routes/projects.routes.ts`

Handles project creation, retrieval, updates, and deletion.

### `backend/src/routes/tasks.routes.ts`

Handles task management including task creation, assignment, status, priority, updates, and deletion.

### `backend/src/routes/project-assignments.routes.ts`

Handles relationships between projects and assigned users.

### `backend/src/routes/project-milestones.routes.ts`

Handles milestone creation, retrieval, updates, and deletion for project timeline monitoring.

### `src/components/Login.tsx`

Provides the frontend login interface and communicates with the Express authentication API.

### `src/App.tsx`

Acts as the main frontend application controller and integrates authenticated backend data with the existing dashboard components.

---

## Current Development Focus

The project is currently being improved in the following areas:

* Frontend and backend integration
* PostgreSQL-driven dashboard data
* Admin dashboard integration
* User dashboard integration
* Project management integration
* Task management integration
* Project assignment interface
* Gantt and milestone integration
* Workload visualisation
* Authentication flow refinement
* User experience refinement
* System testing and validation

---

## Project Completion

The system development phase has been completed, including:

* Frontend and backend integration
* PostgreSQL database integration
* User authentication and role-based access
* User, project and task management
* Project assignment functionality
* Milestone and Gantt timeline tracking
* Workload monitoring
* Dashboard integration
* System testing and refinement
Deployment and production rollout are being managed internally by Celestica staff.

---

## Planned Improvements

Future enhancements may include:

* Complete role-based dashboard redirection
* First-login password change workflow
* Forgot password functionality
* Improved session expiration handling
* Enhanced dashboard visualisation
* Additional workload analytics
* Improved project timeline visualisation
* Notification functionality
* Cloud deployment
* Improved validation and error handling
* Additional system security improvements

---

## Project Context

This system was developed during my internship to support project tracking and workload monitoring activities.

The original workflow relied heavily on spreadsheet-based tracking, while this system was designed to provide a more centralized and structured way to manage project information, task assignments, workload, priorities, statuses, and project timelines.

This public repository contains only **non-confidential development materials**.

Sensitive company information, internal organizational data, production credentials, and confidential business information are not included.

---

## Author

**Nur'Ain Farisya Binti Khairul Nidzar**  
Bachelor of Information Technology (Hons.)  
Universiti Teknologi PETRONAS

**GitHub:** [AinFarisya](https://github.com/AinFarisya)  
**LinkedIn:** [ainfarisya0328](https://linkedin.com/in/ainfarisya0328)
