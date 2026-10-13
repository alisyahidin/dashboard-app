# Field Report Dashboard

A web app for managing field reports, built for the MAPID Fullstack Developer case study. Field officers submit reports, supervisors and admins approve or reject them, and admins manage who can sign in. It has a REST API (Express + PostgreSQL) and a dashboard (React + Vite).

**Live app:** https://app-dashboard-report.vercel.app
**API:** https://dashboard-app-g27tbq.fly.dev/api/v1 (health check at `/health`)

## Demo accounts

| Role | Email | Password | What to try |
| --- | --- | --- | --- |
| Officer | `officer@mail.com` | `officer123!#` | Create a report, edit it while it is pending |
| Supervisor | `supervisor@mail.com` | `supervisor123!#` | Approve or reject pending reports, filter by officer |
| Admin | `admin@mail.com` | `admin123!#` | Everything a supervisor can do, plus add and edit users |

## Case study requirements

| Requirement | Where it is |
| --- | --- |
| Express.js (TypeScript) and PostgreSQL | [`backend`](backend): Express 5, TypeScript, Drizzle ORM on PostgreSQL |
| Database schema in the repository | Tables in [`backend/src/db/schema.ts`](backend/src/db/schema.ts), SQL in [`backend/src/db/migrations`](backend/src/db/migrations) |
| Report has name, description and status (pending, approved, rejected) | `reports` table, plus a sequential report number, submitter, timestamps and a history table |
| Endpoint to create a report | `POST /api/v1/reports` |
| Endpoint to list reports | `GET /api/v1/reports` with search, status filter, officer filter and pagination |
| Endpoint to change status to approved or rejected | `POST /api/v1/reports/:id/status` |
| React (Vite) frontend | [`frontend`](frontend): React 19, React Router 8 in SPA mode, Vite |
| Reports table with status | Reports page, with a status badge on each row |
| Form to add a report | New report dialog on the dashboard and the reports page |
| Approve and Reject buttons on each report | Approve and Reject actions on each pending row. Rejecting asks for a reason. |
| README on how to run the project | This file, plus [backend/README.md](backend/README.md) and [frontend/README.md](frontend/README.md) |
| Deployed online (optional) | Frontend on Vercel, API on Fly.io (links above) |

## What else it does

- **Sign-in and roles.** Email and password sign-in with an HttpOnly session cookie. Each role sees and does only what it is allowed to, and the API checks every request.
- **Report history.** Every report records who created it, who edited it and who decided on it, with the reason. Open it from the history icon on a row.
- **Changing a decision.** An approved report can be switched to rejected, or back, with a reason.
- **Safe reviews.** If two reviewers act on the same report at once, the second one is told it already changed instead of overwriting it.
- **Editing pending reports.** Officers can correct their own report while it is pending. Admins can edit any pending report.
- **Dashboard.** Counts by status and the latest reports.
- **User management.** Admins add users and pick their role. Each new user gets a login link that works once and never expires. The person opens it, sets a password and is signed in.
- **Protection.** Sign-in is blocked for 15 minutes after 5 failed attempts. Admins cannot change their own role.

## Roles

| | Admin | Supervisor | Officer |
| --- | --- | --- | --- |
| See reports | All | All | Own only |
| Create reports | | | Yes |
| Edit pending reports | Any | | Own only |
| Approve and reject | Yes | Yes | |
| Filter reports by officer | Yes | Yes | |
| Add and edit users | Yes | | |

## Run it locally

You need Node.js 24, pnpm 11 and a PostgreSQL 13+ database (a local install, Supabase or Neon all work).

**1. Backend** (runs on `http://localhost:3001`)

```bash
cd backend
pnpm install
cp .env.example .env
```

Fill in `DATABASE_URL` and `JWT_SECRET` in `backend/.env`. Generate a secret with `openssl rand -base64 48`. Then:

```bash
pnpm db:setup
pnpm db:seed
pnpm dev
```

`db:setup` creates the tables and `db:seed` adds the roles and the three demo accounts above.

**2. Frontend** (runs on `http://localhost:5173`), in a second terminal:

```bash
cd frontend
pnpm install
cp .env.example .env
pnpm dev
```

Open `http://localhost:5173` and sign in with a demo account.

More detail, including every environment variable, script and endpoint, is in [backend/README.md](backend/README.md) and [frontend/README.md](frontend/README.md).

## How it fits together

```
Browser ──► frontend (localhost:5173 / Vercel)
               │  /api/v1/*  (Vite proxy in development, Vercel rewrite in production)
               ▼
            backend (localhost:3001 / Fly.io) ──► PostgreSQL
```

The browser only talks to the frontend's origin, and requests to `/api/v1` are forwarded to the backend. That keeps the session cookie first-party and avoids CORS setup.

The backend is split into layers: routes check sign-in and role, controllers validate input with zod, services hold the business rules, and repositories run the database queries.

## Database

| Table | Holds |
| --- | --- |
| `reports` | Report number, name, description, status, submitter and review time |
| `report_history` | Every create, edit and status change, with actor, reason and changed fields |
| `users` | Name, email, password hash and role |
| `roles`, `permissions`, `role_permissions` | Admin, Supervisor and Officer, and what each can do |
| `sessions` | Active sign-ins, so logging out revokes the session |
| `invites` | Login links for new users |

## Projects

| Folder | Stack | Deployed to |
| --- | --- | --- |
| [`backend`](backend) | Node.js 24, Express 5, TypeScript, Drizzle ORM, PostgreSQL, zod, argon2, jose | Fly.io |
| [`frontend`](frontend) | React 19, React Router 8, Vite, Tailwind CSS 4, shadcn on Base UI, SWR, TanStack Form | Vercel |
