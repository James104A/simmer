---
title: "Simmer — Project Overview"
generated: 2026-05-09
---

# Project Overview

## What it is

**Simmer** is a private, family-scoped social cooking app: a personal recipe vault layered with an activity feed of what your trusted circle actually cooks. The product brief frames it as the white space between recipe managers (Paprika, Pestle — no social) and public cooking networks (Pepper, Cookpad — no strong personal vault).

Core capabilities today:

- **Recipe vault** — paste any URL, AI extracts a structured recipe via Gemini; or type one natively. Tag with cuisine, dish type, dietary, season, etc. Search and filter.
- **Cook tracking** — log when you cook a recipe; rate it; mark favorites; "discard" recipes that flopped (with a record kept in the feed).
- **Activity feed** — see your friends' cook events, recipe adds, and saves; tap to add their recipes to your "want to try" list.
- **Friends + partner** — friends are mutual and feed-visible; a single partner shares a full recipe vault with you (read + edit + personal notes).

## Tech at a glance

| | |
|---|---|
| **Type** | Single Next.js App Router monolith (web app) |
| **Languages** | TypeScript, SQL (via Prisma) |
| **Framework** | Next.js 16 + React 19 |
| **Database** | PostgreSQL via Prisma 7 (PrismaPg adapter) |
| **Auth** | Custom session table + httpOnly cookie |
| **AI** | Google Gemini 2.5 Flash for recipe URL extraction |
| **Styling** | Tailwind CSS v4 |
| **Deployment** | Vercel (per README) |

## Architecture in one paragraph

The Next.js process serves both server-rendered pages (which read directly from Prisma) and JSON API routes. Mutations go through `/api/*`; reads happen as async server components. There is no separate backend, no message queue, no cache layer, no client-side state library. Real-time updates use 30-second polling. Recipe URL extraction tries JSON-LD first, then falls back to Gemini (with `urlContext` and `googleSearch` tools for Cloudflare-protected sites).

For full detail: [architecture.md](./architecture.md).

## Repository layout

Single-part monolith. Top-level directories:

- `src/app/` — Next.js App Router (pages + API)
- `src/components/` — React components
- `src/lib/` — Server-side helpers (auth, Prisma client, AI, extraction, friends, partner)
- `src/hooks/` — Two custom hooks (`useFeedPolling`, `useWakeLock`)
- `prisma/` — Schema, migrations, seed
- `_bmad-output/planning-artifacts/` — Product brief and PRD for the existing web app
- `Context/` — Original PDF brief

Annotated tree: [source-tree-analysis.md](./source-tree-analysis.md).

## Documentation map

| Doc | Use for |
|---|---|
| [architecture.md](./architecture.md) | System overview, subsystems (auth, social graph, extraction, feed), tech stack, mobile implications |
| [api-contracts.md](./api-contracts.md) | All 16 endpoints — methods, bodies, responses, gotchas |
| [data-models.md](./data-models.md) | Prisma schema breakdown, deletion behavior, migration history |
| [component-inventory.md](./component-inventory.md) | UI components and hooks |
| [source-tree-analysis.md](./source-tree-analysis.md) | Directory tree with annotations |
| [development-guide.md](./development-guide.md) | Setup, scripts, env vars, conventions |

## Status & maturity

- **Active development.** Schema migrations span 2026-03 → 2026-04 with the social/partner pivot landing in late March.
- **Pre-test** — no test suite yet.
- **Pre-observability** — no structured logging, no metrics, no tracing.
- **Single-environment posture** — no staging conventions in repo; deployment story is "Vercel + managed Postgres".

## Where mobile planning starts

Read [architecture.md § Implications for a mobile app](./architecture.md#implications-for-a-mobile-app) — it's the bridge document. The five decisions teed up at the bottom of that section (form factor, auth path, real-time, extraction UX, offline) are the right inputs for the **Technical Research (TR)** workflow before the mobile PRD.
