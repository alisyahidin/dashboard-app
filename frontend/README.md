# Frontend

Web app for the Field Report Dashboard. It is a single-page app built with React Router 8 (SPA mode), Vite, Tailwind CSS 4 and shadcn components on Base UI.

## Requirements

- Node.js 24
- pnpm 11
- The [backend](../backend) running locally

## Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create your environment file:

   ```bash
   cp .env.example .env
   ```

   `BASE_API_URL` is where the dev server forwards API calls. The default `http://localhost:3001` matches the backend's example `PORT`.

3. Start the backend (see [backend/README.md](../backend/README.md)), then start the app:

   ```bash
   pnpm dev
   ```

4. Open `http://localhost:5173` and sign in with one of the seeded accounts from `backend/src/db/seed/users.ts`.

## Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `BASE_API_URL` | `http://localhost:3001` | Backend address for the dev server proxy. Only used by `pnpm dev`. |

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Starts the Vite dev server with hot reload on port 5173. |
| `pnpm build` | Builds the app into `build/`. |
| `pnpm start` | Serves the built app. |
| `pnpm typecheck` | Generates React Router route types, then type-checks. |

## How the app talks to the API

The app always calls the API on its own origin at `/api/v1`, so the session cookie stays first-party.

- In development, Vite proxies `/api/v1` to `BASE_API_URL` (see `vite.config.ts`).
- In production, Vercel rewrites `/api/v1` to the backend on Fly.io (see `vercel.json`).

All requests go through `api()` in `app/services/api.ts`. Errors come back as `ApiError` with the status, message and any field errors. A 401 sends the user to `/login` and back to the same page after sign-in. A 403 shows a "Not allowed" message and refreshes the page data.

## Project structure

```
app/
├── root.tsx          App shell
├── routes.ts         Route table
├── routes/           Route modules: page title, loaders and auth guards
├── pages/            Page components (login, dashboard, reports, users, invite)
├── components/
│   ├── ui/           shadcn components
│   ├── layout/       Sidebar, menus and user menu
│   ├── reports/      Report dialogs, history sheet and table states
│   └── admin/        Add and edit user dialog, login link dialog
├── services/         API calls, one file per area
├── hooks/            SWR data hooks, form and auth helpers
└── lib/              Permission checks and formatting
```

Pages are shown based on the signed-in user's role and permissions:

| Page | Path | Who sees it |
| --- | --- | --- |
| Sign in | `/login` | Signed out |
| Dashboard | `/` | Everyone signed in |
| Reports | `/reports` | Everyone signed in. Officers see their own reports. Admins and Supervisors can filter by officer. |
| Users | `/admin/users` | Admin |
| Set up your account | `/invite/:token` | Anyone with an invite link |

## Adding UI components

Components come from shadcn with the `base-nova` style (see `components.json`):

```bash
pnpm dlx shadcn@latest add <component>
```

## Deployment

The app is deployed to [Vercel](https://vercel.com) using the `@vercel/react-router` preset. Import the `frontend` folder as the project root. No environment variables are needed in production, because `vercel.json` sends `/api/v1` requests to the backend. If the backend URL changes, update the rewrite destination in `vercel.json`.
