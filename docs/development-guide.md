---
title: "Simmer — Development Guide"
generated: 2026-05-09
---

# Development Guide

## Prerequisites

- **Node.js** — version not pinned in repo, but Next.js 16 requires Node ≥ 20. Recommend Node 22 LTS.
- **PostgreSQL** — any 14+ instance reachable via `DATABASE_URL`. The Prisma client uses the `@prisma/adapter-pg` driver.
- **Gemini API key** — optional locally, but required for the recipe URL summarize endpoint.

## Environment variables

Set in `.env` (loaded via `dotenv` in [prisma.config.ts](../prisma.config.ts) and by Next.js automatically).

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Postgres connection string used by both Prisma migrations and the runtime client |
| `GEMINI_API_KEY` | no (in dev) | Enables AI extraction in `POST /api/recipes/summarize`. Without it the endpoint falls through to structured-data-only. |
| `NODE_ENV` | auto | Controls cookie `secure` flag — set to `production` only in deployed environments. |

There is **no** `.env.example` in the repo. The variables above are the full set referenced in code.

## Setup

```bash
git clone <repo>
cd <repo-root>
npm install                 # also runs `prisma generate` via postinstall
npx prisma migrate dev      # apply migrations to your local Postgres
npm run db:seed             # optional — populate sample data
npm run dev                 # http://localhost:3000
```

## Scripts

From [package.json](../package.json):

| Script | Command | Notes |
|---|---|---|
| `dev` | `next dev` | Dev server with HMR |
| `build` | `next build` | Production build |
| `start` | `next start` | Run production build |
| `lint` | `eslint` | ESLint with `eslint-config-next` |
| `db:migrate` | `npx prisma migrate dev` | Generate + apply a migration |
| `db:seed` | `npx tsx prisma/seed.ts` | Seed the database |
| `db:reset` | `npx prisma migrate reset` | Drop + recreate + reseed (destructive) |
| `postinstall` | `prisma generate` | Auto-runs on `npm install` |

## Code conventions observed

- **TypeScript strict mode** is on (`tsconfig.json`). Path alias `@/*` → `src/*`.
- **App Router pages are server components** unless they need state. Async server components fetch directly via Prisma; results are passed to `"use client"` children as props.
- **API routes** call `getCurrentUser()` first, then short-circuit with 401 if absent. No middleware for API auth — each route handles its own.
- **Database mutations** use `prisma.$transaction(...)` when multiple writes need to be atomic (cook log + recipe update + feed event being the canonical example).
- **Tag arrays** are JSON-stringified on POST and stored as `String?` columns. Clients (web and any future mobile) must `JSON.parse` on read.
- **No tests yet** — there's no `test` script and no test framework dependency. Test file patterns: none observed.

## Deployment

- The README mentions Vercel. There's no `Dockerfile`, no CI configuration in `.github/workflows/`, no deployment scripts. Inference: deployed via Vercel + a managed Postgres.
- **No CORS config** in [next.config.ts](../next.config.ts) — same-origin only by default.
- **No build-time secrets check** — missing `GEMINI_API_KEY` doesn't fail the build; the summarize route falls through to structured-data-only.

## Things to know

- **Prisma client output is non-default**: `src/generated/prisma/`. Imports are `@/generated/prisma/client`, not `@prisma/client`.
- **`auth-status` cookie is intentionally non-httpOnly** so client-side JS can detect logged-in state without a round-trip. Don't conflate it with the real session token (`auth-token`).
- **Middleware doesn't validate the session** — it just checks for the cookie's presence and redirects unauth'd users on a small allow-list of routes ([middleware.ts:18](../middleware.ts:18)). Real validation happens in API routes / server components via `getCurrentUser()`.
- **`POST /api/feed`** exists but is dead code — feed events are auto-emitted by the cook/save/create paths.
- **Migration timestamps are 2026-03 to 2026-04** — i.e. the first social/partner pivot is recent and the schema is still settling. Treat current models as the contract but expect minor evolution.
