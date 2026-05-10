---
title: "Simmer — Documentation Index"
generated: 2026-05-09
project_type: web
repository_type: monolith
---

# Simmer Documentation Index

The primary entry point for AI-assisted development on this codebase. Start here.

## Project Overview

- **Type:** Monolith (single Next.js project)
- **Primary Language:** TypeScript
- **Architecture:** Next.js 16 App Router monolith — server-rendered pages + JSON API routes in one process, Postgres via Prisma, Gemini for AI recipe extraction
- **Status:** Active development; recently pivoted to social/partner features

## Quick Reference

- **Tech Stack:** Next.js 16, React 19, TypeScript 5, Prisma 7, PostgreSQL, Tailwind CSS v4, Google Gemini 2.5 Flash
- **Entry Points:** `src/app/page.tsx` (web), `src/app/api/**/route.ts` (API), `npm run dev` (local)
- **Architecture Pattern:** Layered server-rendered monolith

## Generated Documentation

- [Project Overview](./project-overview.md) — what Simmer is, tech at a glance, doc map
- [Architecture](./architecture.md) — full system architecture, subsystems, **mobile implications**
- [Source Tree Analysis](./source-tree-analysis.md) — annotated directory tree, critical paths
- [API Contracts](./api-contracts.md) — every endpoint, method, body, response
- [Data Models](./data-models.md) — Prisma schema, relationships, migration history
- [Component Inventory](./component-inventory.md) — React components and hooks
- [Development Guide](./development-guide.md) — setup, env vars, scripts, conventions

## Existing Documentation

- [Product Brief](../_bmad-output/planning-artifacts/product-brief-Simmer.md) — current product brief (web app, 2026-03-22)
- [PRD](../_bmad-output/planning-artifacts/prd.md) — current PRD
- [Original PDF brief](../Context/Go-To_Recipes_PRD.pdf) — pre-pivot context

## Getting Started

1. **Onboarding the codebase**: read `project-overview.md` → `architecture.md` → `data-models.md` → `api-contracts.md`.
2. **Local development**: follow `development-guide.md`. You'll need a Postgres instance and (optionally) a `GEMINI_API_KEY`.
3. **Planning a mobile app**: jump to [architecture.md § Implications for a mobile app](./architecture.md#implications-for-a-mobile-app). Use it as the input to the **Technical Research (TR)** workflow before the mobile PRD.

## Mobile-planning shortlist

The decisions worth resolving before drafting a mobile PRD (detailed in `architecture.md`):

1. **Form factor** — PWA / React Native / fully native?
2. **Auth path** — extend the existing session table with a Bearer-token header, or use cookies?
3. **Real-time** — keep polling, move to SSE, or invest in push?
4. **Extraction UX** — keep synchronous, or move to async + status polling?
5. **Offline** — explicit decision, even if "no" for v1.

These five questions are the right input to the next workflow.
