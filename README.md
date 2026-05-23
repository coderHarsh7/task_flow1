# TaskFlow — Team Task Manager

A full-stack web app for managing projects, assigning tasks, and tracking team progress with role-based access control.

## Features

- **Auth** — JWT-based signup/login
- **Projects** — Create projects, invite teammates, manage roles (Admin / Member)
- **Tasks** — Create, assign, prioritize, and track tasks with a kanban board
- **Dashboard** — Personal overview of assigned tasks, overdue work, and progress stats
- **RBAC** — Admins manage team membership; all members can manage tasks

## Tech Stack

| Layer    | Tech                          |
|----------|-------------------------------|
| Frontend | React 18, Tailwind CSS, Vite  |
| Backend  | Node.js, Express              |
| Database | PostgreSQL                    |
| Auth     | JWT (jsonwebtoken + bcryptjs) |

## Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL running locally

### 1. Clone and install

```bash
git clone <repo-url>
cd taskflow
npm run install:all
```

### 2. Configure environment

```bash
cp .env.example server/.env
# Edit server/.env with your DB credentials and JWT secret
```

### 3. Create the database

```sql
CREATE DATABASE taskflow;
```

Tables are auto-created on first server start via `schema.sql`.

### 4. Run in development

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Deployment (Railway)

1. Push to GitHub
2. Create a new Railway project
3. Add a **PostgreSQL** service — Railway auto-injects `DATABASE_URL`
4. Add a **Node.js** service pointing to the repo root
5. Set environment variables:
   - `JWT_SECRET` — any long random string
   - `NODE_ENV=production`
6. Build command: `npm run build`
7. Start command: `npm start`

The Express server serves the built React files in production.

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Project + members |
| POST | `/api/projects/:id/members` | Add member (admin) |
| DELETE | `/api/projects/:id/members/:uid` | Remove member (admin) |
| GET | `/api/tasks/mine` | My assigned tasks |
| GET | `/api/tasks/project/:id` | Project tasks |
| POST | `/api/tasks/project/:id` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| PATCH | `/api/tasks/:id/status` | Update status |
| DELETE | `/api/tasks/:id` | Delete task |
