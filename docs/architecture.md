---
title: "Simmer — Architecture"
generated: 2026-05-09
project_type: web (Next.js App Router monolith)
---

# Architecture

## Executive summary

Simmer is a **Next.js 16 App Router monolith** running on Postgres via Prisma. The same Node process serves React-rendered pages, JSON API routes, and Gemini-backed recipe extraction. There is no separate backend service, no message queue, no cache layer, and no client-side state library. Reads happen as server components; mutations go through `/api/*` route handlers.

The codebase is small (~16 API endpoints, ~14 React components, 9 Prisma models, ~1.5k lines of business logic) and deliberately so — the brief calls out leveraging existing infrastructure rather than over-engineering.

## Architecture pattern

**Layered, server-rendered, single-tier.**

```
┌─────────────────────────────────────────────────────────────┐
│  Browser                                                    │
│   ├─ HTML from server components (initial paint)            │
│   ├─ Client components (forms, polling, wake lock)          │
│   └─ httpOnly auth-token cookie (session)                   │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP (same-origin)
┌──────────────────────▼──────────────────────────────────────┐
│  Next.js 16 (Node) — single process                         │
│                                                             │
│   middleware.ts  ── cookie presence gate (a few routes)     │
│                                                             │
│   src/app/**/page.tsx       src/app/api/**/route.ts         │
│       │                          │                          │
│       └─── server components ────┘                          │
│              │                                              │
│              ▼                                              │
│   src/lib/* — auth, friends, partner, ai, extract           │
│              │                                              │
│              ▼                                              │
│   Prisma 7  (PrismaPg adapter)                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
       ┌───────────────┴────────────────┐
       ▼                                ▼
┌─────────────┐              ┌──────────────────────┐
│ PostgreSQL  │              │ Google Gemini API    │
│ (Prisma)    │              │ (recipe extraction)  │
└─────────────┘              └──────────────────────┘
```

## Technology stack

| Layer | Choice | Version | Notes |
|---|---|---|---|
| Framework | Next.js | 16.1.6 | App Router exclusively; no Pages Router |
| UI runtime | React | 19.2.3 | RSC + client components |
| Language | TypeScript | 5.x | Strict mode |
| ORM | Prisma | 7.4.2 | Generated to `src/generated/prisma/` |
| DB driver | `@prisma/adapter-pg` + `pg` | 7.4.2 / 8.19 | Native Node pg driver via Prisma's adapter pattern |
| Database | PostgreSQL | 14+ | Hosted (likely Vercel Postgres given Vercel deployment) |
| Auth | Custom session table | — | bcryptjs (cost 12) + `crypto.randomUUID()` token; httpOnly cookie |
| AI | `@google/genai` | 1.43 | Gemini 2.5 Flash. Tools: urlContext, googleSearch |
| HTML extraction | `linkedom` + `@mozilla/readability` | 0.18 / 0.6 | JSON-LD first, AI fallback |
| Styling | Tailwind CSS | 4.x | `@tailwindcss/postcss` |
| Fonts | Geist (sans/mono) + Playfair Display | — | Loaded via `next/font/google` |

## Subsystems

### Authentication

- **Cookie-based sessions.** Login/signup writes a row to `Session` with a UUID token, returns it as a 7-day httpOnly cookie (`auth-token`). A second non-httpOnly cookie (`auth-status`) lets client JS know whether the user is logged in without a round trip.
- **`getCurrentUser()`** ([src/lib/auth.ts:38](../src/lib/auth.ts:38)) is the single read path: cookie → Session lookup → User. Expired sessions are deleted on miss.
- **`middleware.ts`** redirects unauth'd users from a small allow-list of pages (`/recipes/new`, `/recipes/:id/edit`, `/feed`, `/friends`) to `/login?redirect=...`. It does **not** validate the session — only checks for cookie presence. Real validation happens per-route.

### Social graph: friends vs. partners

Two distinct relationship models with different semantics:

- **Friends** (`FriendRequest`, status `pending|accepted|declined`) → mutual; gates feed visibility and recipe-detail access (minus personal notes). N-to-many.
- **Partner** (`Partnership`, status `pending|accepted`) → exclusive (max one per user); creates a **shared recipe vault** — partners' recipes appear in each other's library, both can edit, both see each other's `personalNotes`. 1-to-1.

Friend visibility logic is encapsulated in `getFriendIds()`; partner logic in `getPartnerId()` / `hasPartnership()` ([src/lib/partner.ts](../src/lib/partner.ts)). Recipe access checks combine both ([src/app/api/recipes/[id]/route.ts:25–45](../src/app/api/recipes/[id]/route.ts:25)).

### Recipe ingestion (linked recipes)

The most complex subsystem. `POST /api/recipes/summarize` runs a fallback chain:

```
URL ──► server fetch ──► linkedom parse ──► JSON-LD Recipe found?
                                              │
                          ┌───────────────────┴───────────────────┐
                          ▼ (yes, complete)               ▼ (no / incomplete)
                    return structured              GEMINI_API_KEY set?
                                                   ├── no ──► return partial
                                                   └── yes ─► Gemini summarize(text)
                                                                │
                                                  ┌─────────────┴───────────┐
                                                  ▼ (server fetch failed)   │
                                              Gemini urlContext             │
                                                  │                         │
                                                  ▼ (urlContext failed)     │
                                              Gemini googleSearch           │
                                                  │                         │
                                                  └────► merge with structured
```

`extract.ts` handles the JSON-LD parse (and a fallback `og:image` lookup); `ai.ts` wraps Gemini. The `method` field in the response (`structured | structured+ai | ai | ai-url-context`) tells the client which path was used — useful for debugging extraction quality.

### Feed pipeline

Feed events are **side effects** of other mutations. Every cook log, save, recipe creation, and discard writes a row into `FeedEvent` with `eventType` ∈ `{ cook, cook_favorite, cook_discard, add_recipe, save_recipe }`. The feed page server-renders the latest 50 events for `[me, ...friends]` and then `useFeedPolling` polls `/api/feed?since=<ISO>` every 30 seconds, staging new items behind a "N new updates" banner ([src/hooks/use-feed-polling.ts](../src/hooks/use-feed-polling.ts)).

When a `cook_discard` is recorded, the recipe FK on FeedEvent is `SetNull` and a snapshot of the recipe (title, image, cuisine, dish type) is stored in the event's `metadata` JSON so the entry still renders after the recipe is gone.

### Recipe imagery

Cards and feed items show an image even when no source image was extracted. [src/lib/recipe-images.ts](../src/lib/recipe-images.ts) implements a deterministic fallback chain:

1. Explicit `recipe.imageUrl` (extracted or manually set)
2. Cuisine-based Unsplash URL (Italian, Mexican, Thai, …)
3. Dish-type-based Unsplash URL (Salad, Soup, Dessert, …)
4. Protein-based Unsplash URL (Chicken, Beef, …)
5. Title-hashed gradient pair

The mapping uses `hashString(recipe.title) % images.length` so the same recipe always gets the same image — important for visual stability.

## Source-tree map

See [source-tree-analysis.md](./source-tree-analysis.md). High-level:

- `src/app/` — Routes (pages + API)
- `src/components/` — React components (flat)
- `src/hooks/` — Two custom hooks (polling, wake lock)
- `src/lib/` — Server-side helpers
- `src/types/` — UI-facing TypeScript types
- `prisma/` — Schema, migrations, seed
- `middleware.ts` — Edge middleware (cookie gate)

## Data architecture

See [data-models.md](./data-models.md) for the full Prisma schema breakdown. The model graph:

```
User ──< Recipe ──< CookLog
   │       │  │
   │       │  └──< FeedEvent ──> User
   │       │
   │       └──< AISummaryJob
   │
   ├──< Session
   ├──< SavedRecipe >── Recipe
   ├──< FriendRequest (sender|receiver)
   └──< Partnership (sender|receiver, max 1)
```

Deletion behavior worth knowing:
- User cascade deletes everything they own.
- Recipe cascade deletes its CookLogs, AISummaryJobs, and SavedRecipe references.
- FeedEvent's `recipeId` is `SetNull` — events outlive their recipes (used by `cook_discard`).

## API design

REST-ish JSON over HTTP. Endpoint catalog in [api-contracts.md](./api-contracts.md). Conventions:

- App Router route handlers (`route.ts`) export `GET`, `POST`, `PATCH`, `DELETE` named functions.
- Auth via httpOnly cookie; every endpoint calls `getCurrentUser()` first.
- No request validation library, no rate limiting, no pagination on most endpoints.

## Component overview

See [component-inventory.md](./component-inventory.md). Pattern: pages are async server components that read directly from Prisma, then hand props to `"use client"` children. No state management library; client state is local.

## Development workflow

See [development-guide.md](./development-guide.md).

- `npm run dev` against a local Postgres
- `npx prisma migrate dev` to evolve schema
- ESLint + TypeScript strict (no test suite yet)

## Deployment

- Vercel-targeted (per README). No `Dockerfile`, no GitHub Actions in repo.
- Environment configuration: `DATABASE_URL`, `GEMINI_API_KEY`, `NODE_ENV`.
- No CORS config — same-origin browser clients only.

## Cross-cutting concerns / current gaps

- **No tests** — neither unit nor integration. Refactors land via build + manual QA.
- **No observability** — `console.error` in a few places; no structured logging, no tracing.
- **No background jobs** — AI extraction runs synchronously in the request handler. A long Gemini call ties up the HTTP connection.
- **No rate limiting** — particularly relevant for `POST /api/recipes/summarize` (Gemini cost) and `POST /api/auth/login` (credential brute force).
- **Cookie auth only** — no Bearer token path. Mobile clients have to either play cookie tricks or the backend has to add an Authorization header path.

## Implications for a mobile app

This section is the bridge to the mobile planning effort. Annotated by impact:

| Concern | Current state | Mobile implication |
|---|---|---|
| **Auth** | httpOnly cookie + `Session` table | Either (a) mobile maintains a cookie jar and treats the API as a single-host backend, or (b) add a Bearer-token alternative reading the same `Session.token`. Option (b) is a small change. |
| **CORS** | None configured | If mobile hits the same domain (RN with embedded WebView, or a PWA at the same origin), no change. If mobile is a separate origin, add CORS to `next.config.ts`. |
| **Real-time** | 30s polling + wake-on-visibility | Polling works on mobile but burns battery. Push notifications would need a new backend subsystem. WebSockets aren't trivial on Vercel's serverless model — Server-Sent Events or a 3rd-party push service are friendlier. |
| **Recipe extraction** | Server-only (Gemini key + page fetch) | Mobile must call `POST /api/recipes/summarize` rather than running extraction locally. The endpoint is currently synchronous — a mobile-friendly variant would be background-job-style with a status poll. |
| **Visibility model** | Friend / partner / saved-by-me logic in API layer | Mobile **must** consume the existing `/api/recipes/[id]` endpoint to honor the rules. Don't re-implement on the client. |
| **Tag vocabularies** | [src/lib/constants.ts](../src/lib/constants.ts) | The exact strings are the contract. Mobile should re-export them from a shared source or hardcode the same values. |
| **Recipe images** | Deterministic fallback chain | Re-implement identically on mobile so the same recipe shows the same image across web and app. |
| **Code reuse from web** | None today (server components, Tailwind, JSX-heavy) | Don't expect to lift web components to React Native. Component **patterns** transfer; **code** does not. The closest reusable unit is `src/lib/constants.ts` and `src/lib/recipe-images.ts` (both pure functions). |
| **Wake lock for cooking** | Web Wake Lock API ([src/hooks/use-wake-lock.ts](../src/hooks/use-wake-lock.ts)) | Native equivalent: iOS `UIApplication.idleTimerDisabled`, Android `FLAG_KEEP_SCREEN_ON`, RN `expo-keep-awake`. |
| **PWA option** | No `manifest.json`, no service worker | A PWA path is *not* free; you'd add manifest + SW + offline strategy. Probably the simplest route if minimal native polish is acceptable. |

## Recommended decisions to make before mobile PRD

1. **Form factor**: PWA wrap of the existing app, React Native + shared API, or fully native iOS+Android? Each has very different effort and feature ceilings.
2. **Auth path**: Cookie jar vs. Bearer token addition. Bearer is a few hours of work and unblocks every other client.
3. **Real-time**: Stay on polling, add SSE, or invest in push notifications? Mobile UX expectations probably demand at least one of the latter two.
4. **Extraction UX**: Sync (current) vs. async with status. Sync is fine for fast sites; on cellular with Cloudflare-protected sites, the synchronous Gemini path can take 10–30s.
5. **Offline support**: Out of scope per current product brief, but worth deciding explicitly for mobile.

These are the questions the **Technical Research (TR)** workflow should chew on before the PRD.
