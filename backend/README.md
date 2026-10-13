# Backend

REST API for the Field Report Dashboard. Built with Express 5, Drizzle ORM and PostgreSQL. It handles sign-in, field reports with review decisions, user management and invite links.

## Requirements

- Node.js 24
- pnpm 11
- PostgreSQL 13 or newer

## Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create your environment file and fill it in:

   ```bash
   cp .env.example .env
   ```

   Generate a `JWT_SECRET` with:

   ```bash
   openssl rand -base64 48
   ```

3. Create the tables. This applies every migration in `src/db/migrations`:

   ```bash
   pnpm db:setup
   ```

4. Seed the roles, permissions and the three starter accounts (Admin, Supervisor, Officer). Their emails and passwords are in `src/db/seed/users.ts`.

   ```bash
   pnpm db:seed
   ```

5. Start the API with hot reload:

   ```bash
   pnpm dev
   ```

   The API runs at `http://localhost:3001` (with the example `PORT`). Check it with `GET /health`.

## Environment variables

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `PORT` | No | `3000` | Port the server listens on. The frontend dev proxy expects `3001`. |
| `NODE_ENV` | Yes | | `development`, `production` or `test`. In production the auth cookie is marked `Secure`. |
| `DATABASE_URL` | Yes | | PostgreSQL connection string, such as `postgres://user:pass@localhost:5432/dashboard`. |
| `JWT_SECRET` | Yes | | At least 32 characters. Used to sign session tokens. |
| `SESSION_TTL_HOURS` | No | `24` | How long a sign-in lasts. |
| `AUTH_CACHE_TTL_SECONDS` | No | `30` | How long a session check is cached in memory. `0` turns the cache off. |

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Runs `src/main.ts` with hot reload, reading `.env`. |
| `pnpm build` | Compiles TypeScript into `build/`. |
| `pnpm start` | Runs the compiled server from `build/`. |
| `pnpm db:setup` | Generates a migration if `src/db/schema.ts` changed, then applies all pending migrations. |
| `pnpm db:seed` | Seeds roles, permissions and the starter accounts. Safe to run again. |
| `pnpm typecheck` | Type-checks without emitting files. |
| `pnpm lint` / `pnpm lint:fix` | Lints with Biome. |
| `pnpm format` / `pnpm format:check` | Formats with Biome. |

## Changing the database

1. Edit `src/db/schema.ts`.
2. Run `pnpm db:setup`. This writes a new folder in `src/db/migrations` and applies it.
3. Commit the migration together with the schema change.

For a data-only change, create an empty migration and write the SQL yourself:

```bash
pnpm exec drizzle-kit generate --custom --name describe_the_change
```

## Project structure

```
src/
├── main.ts           Express app, middleware and server start
├── config/env.ts     Environment variables, validated with zod
├── constants/rbac.ts Roles, permissions and what each role gets
├── routes/v1/        URL routes, with auth and role checks
├── controllers/      Read the request, call a service, send the response
├── services/         Business rules
├── repositories/     Database queries (Drizzle)
├── dto/              Request validation and response shapes (zod)
├── middlewares/      requireAuth, requireRole, requirePermission, error handler
├── lib/              Cookies, JWT, errors, login throttle, database error helpers
└── db/
    ├── schema.ts     Tables
    ├── migrations/   Generated SQL migrations
    └── seed/         Seed scripts
```

A request goes from route → controller → service → repository. Validation errors become `400 { message, errors: { field: [messages] } }`.

## API

Every endpoint is under `/api/v1`. The session token is sent as an HttpOnly `access_token` cookie, or as `Authorization: Bearer <token>`.

| Method | Path | Who can call it |
| --- | --- | --- |
| `POST` | `/auth/login` | Anyone. After 5 failed attempts for one email from one IP address, sign-in is blocked for 15 minutes. |
| `GET` | `/auth/me` | Signed in |
| `POST` | `/auth/logout` | Anyone |
| `GET` | `/reports` | Signed in. Officers see only their own reports. Filters: `status`, `q`, `officer` (Admin and Supervisor only), `page`, `pageSize`. |
| `GET` | `/reports/counts` | Signed in, same scope as the list |
| `GET` | `/reports/:id` | Signed in. Officers can open only their own. |
| `POST` | `/reports` | Officer |
| `PATCH` | `/reports/:id` | Officer (own pending reports) and Admin (any pending report) |
| `POST` | `/reports/:id/status` | Admin and Supervisor. Rejecting or changing a decision needs a reason. |
| `GET` | `/users` | Admin and Supervisor. Only admins see invite links. |
| `POST` | `/users` | Admin. Creates the user with an invite link. |
| `PATCH` | `/users/:id` | Admin. Admins cannot change their own role. |
| `GET` | `/roles` | Admin |
| `GET` | `/invites/:token` | Anyone |
| `POST` | `/invites/:token/accept` | Anyone. Sets the password and signs the user in. |

## Deployment

The API is deployed to [Fly.io](https://fly.io) with the `Dockerfile` in this folder. Fly settings are in `fly.toml`.

1. Set the secrets once:

   ```bash
   fly secrets set DATABASE_URL=... JWT_SECRET=...
   ```

2. Apply migrations to the production database from your machine, pointing `DATABASE_URL` at it:

   ```bash
   DATABASE_URL=<production url> pnpm exec drizzle-kit migrate
   ```

3. Deploy:

   ```bash
   fly deploy
   ```

The container listens on port 3000 and reports health at `/health`.

The login throttle and the session cache live in server memory. With more than one instance, each instance keeps its own counts and cache.
