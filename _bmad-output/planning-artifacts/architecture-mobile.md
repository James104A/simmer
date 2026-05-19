---
stepsCompleted: ["step-01-init", "step-02-context", "step-03-starter", "step-04-decisions", "step-05-patterns", "step-06-structure", "step-07-validation", "step-08-complete"]
inputDocuments:
  - "_bmad-output/planning-artifacts/prd-mobile.md"
  - "_bmad-output/planning-artifacts/ux-design-specification-mobile.md"
  - "_bmad-output/planning-artifacts/product-brief-Simmer.md"
  - "_bmad-output/planning-artifacts/research/technical-simmer-mobile-app-decisions-research-2026-05-09.md"
  - "_bmad-output/planning-artifacts/prd.md"
  - "docs/architecture.md"
  - "docs/data-models.md"
  - "docs/api-contracts.md"
  - "docs/project-overview.md"
  - "docs/source-tree-analysis.md"
  - "docs/component-inventory.md"
  - "docs/development-guide.md"
workflowType: 'architecture'
scope: 'mobile-app'
sourcePRD: 'prd-mobile.md'
sourceUX: 'ux-design-specification-mobile.md'
project_name: 'Simmer Mobile'
user_name: 'Jamesfrauen'
date: '2026-05-10'
status: 'complete'
completedAt: '2026-05-10'
lastStep: 8
---

# Architecture Decision Document — Simmer Mobile App

**Author:** Jamesfrauen
**Date:** 2026-05-10
**Scope:** iOS-only v1 Capacitor wrap of the existing Simmer Next.js web app

This document is the binding architectural contract for Simmer Mobile v1 implementation. All architectural decisions trace to either (a) the mobile PRD's 47 FRs / 45 NFRs, (b) the UX spec's 9 Experience Principles + 5 Emotional Principles, or (c) the May 2026 technical research that pre-resolved the 5 high-stakes architectural questions.

---

## Project Context Analysis

### Requirements Overview

**Functional Requirements (from mobile PRD):** 47 FRs across 8 capability areas.

- **Inherited (FR1–FR7, FR41):** 7 capability-area references to the web PRD's FR1–FR39 plus a touch-only operability rule. All existing web functional capabilities are preserved.
- **Distribution & Installation (FR8–FR10):** TestFlight, native splash, native app icon.
- **Authentication & Session (FR11–FR18, FR42):** Bearer-token path on existing `Session` table; iOS Keychain persistence with `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly`; 30-day sliding-window expiry.
- **Offline Reading & Cache (FR19–FR24, FR37–FR39, FR43–FR44):** Read-only cache via TanStack Query persistence; offline banner; pull-to-refresh; cache invalidation on app resume and on stale-recipe access.
- **Cook Mode (FR25–FR27):** Existing wake lock; status bar dimming.
- **Haptics (FR28–FR30):** Three outcome moments — cook log, save-from-feed, partner unlink.
- **Security & Privacy (FR31–FR35, FR45):** CSP `img-src`, server-side sanitization, cache clear on logout, access-control cache invalidation, App Privacy declaration, fallback image chain.
- **Mobile Navigation & UX (FR36, FR40, FR46–FR47):** First-launch flow, swipe-back, safe areas, dark mode.

**Non-Functional Requirements (from mobile PRD):** 45 NFRs across 9 categories: Performance, Security, Reliability, Resource Consumption, Accessibility, App Store Compliance, Integration, Test Surface, Operations.

**Critical NFRs driving architecture:**

- **NFR1:** Cold start ≤ 2.5 s on a 3-year-old iPhone
- **NFR2:** Cached recipe detail ≤ 500 ms offline
- **NFR16:** Crash-free session ≥ 99.5% (directional — no measurement in v1 per NFR45)
- **NFR10–NFR11:** Session token in iOS Keychain; 30-day sliding-window
- **NFR21:** Vercel backend uptime 99.9% (inherited from web)
- **NFR39–NFR43:** Manual verification gates as the explicit substitute for an integration test net
- **NFR44:** App-version forward compatibility (additive wire-format changes only)
- **NFR45:** No crash reporting, analytics, or telemetry SDKs in v1 — explicit non-goal

### Scale & Complexity

- **Primary domain:** Mobile (iOS) — Capacitor 7.x wrap of an existing Next.js 16 web application
- **Complexity level:** Medium (per PRD classification) — combined test surface across dual auth path + WKWebView + offline cache; App Store Review Guideline 4.2 as a binary gate
- **Estimated architectural components:** 8 new mobile-only artifacts (2 React components + 4 hooks + 1 layout wrapper + 1 native asset set), plus minor backend changes (~10 LOC auth modification + login/signup response body addition + CSP header + content sanitization)
- **No new product entities.** Zero schema migrations. Zero new API endpoints in v1.

### Technical Constraints & Dependencies

**Inherited stack (unchanged from web):**

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js | 16.1.6 |
| UI runtime | React | 19.2.3 |
| Language | TypeScript | 5.x (strict mode) |
| ORM | Prisma | 7.4.2 |
| DB driver | `@prisma/adapter-pg` + `pg` | 7.4.2 / 8.19 |
| Database | PostgreSQL | 14+ (hosted) |
| Auth | Custom `Session` table + httpOnly cookie | — |
| AI | `@google/genai` (Gemini 2.5 Flash) | 1.43 |
| HTML extraction | `linkedom` + `@mozilla/readability` | 0.18 / 0.6 |
| Styling | Tailwind CSS | 4.x |
| Fonts | Geist sans/mono + Playfair Display | — |
| Hosting | Vercel | Pro (required for Fluid Compute) |

**Added for mobile v1:**

| Layer | Technology | Version |
|---|---|---|
| Native shell | Capacitor | 7.x |
| Native build | Xcode | 16+ |
| Target OS | iOS | 16+ |
| Data fetching / cache | TanStack Query | 5.x (latest stable) |
| Cache persistence | `@tanstack/query-async-storage-persister` | 5.x |
| Capacitor plugins | `@capacitor/network`, `@capacitor/preferences`, `@capacitor/haptics`, `@capacitor/status-bar`, `@capacitor/splash-screen`, `@capacitor/app`, `@capacitor-community/secure-storage` | latest compatible with Capacitor 7 |

**Hard constraints:**

- **Solo developer** — every architectural decision must respect single-maintainer feasibility
- **No new schema migrations in v1** — the database schema is treated as frozen for mobile launch
- **Vercel Pro with Fluid Compute** — required for `maxDuration: 60` on `/api/recipes/summarize` per research
- **iOS 16+ minimum** — aligns with Capacitor 7 baseline and the founder family's device cohort
- **Apple Developer Program enrollment** — hard prereq before public TestFlight invites; budget $99/yr + 1–14 day verification delay
- **No automated test suite** — manual verification gates (NFR39–NFR43) are the explicit substitute

### Cross-Cutting Concerns Identified

| Concern | Architectural response |
|---|---|
| **Dual-path authentication (cookie + Bearer)** | Extend `getCurrentUser()` in `src/lib/auth.ts` to read `Authorization: Bearer <token>` as fallback; same `Session.token` UUIDs; no new schema. Touches every authed API route. Mitigation: NFR39 regression checklist + NFR40 smoke test. |
| **Offline-first read** | TanStack Query as the data-fetching primitive replacing direct `fetch` in client components. Persistence layer keyed by user ID. Cache invalidation on logout (FR33), partner unlink / friend removal (FR34), app resume (FR23), network restore (FR37). |
| **Native shell isolation** | All Capacitor APIs accessed via custom hooks that no-op on web (`Capacitor.isNativePlatform()` is the single runtime check). Web code paths never see Capacitor imports at runtime. |
| **Content security** | CSP `img-src` allowlist on `/recipes/[id]` pages (FR31); server-side sanitization in extraction pipeline (FR32). Both required for token-leak defense. |
| **iOS HIG compliance** | Safe areas (FR46), Dynamic Type (NFR27), VoiceOver labels (NFR26, P8), 44 × 44 pt touch targets (NFR28), WCAG AA contrast (NFR29), dark mode (FR47). |
| **App Store Review Guideline 4.2** | Native polish budget — splash, icon, status bar styling, haptics, edge-to-edge layout — to defeat the "looks like a website" rejection. |

---

## Starter Template Evaluation

### Primary Technology Domain

**Mobile app — Capacitor wrap of an existing Next.js codebase.**

This is not a greenfield mobile project. The "starter" is the existing Simmer Next.js 16 codebase at `/Users/jamesfrauen/dev/Simmer/`. Capacitor is added as a packaging layer, not a project scaffold.

### Starter Options Considered

The May 2026 technical research evaluated four mobile-app form factors. Capacitor was selected; the alternatives are documented in [research/technical-simmer-mobile-app-decisions-research-2026-05-09.md](research/technical-simmer-mobile-app-decisions-research-2026-05-09.md). Summary:

| Option | Verdict | Rationale (per research) |
|---|---|---|
| **PWA on iOS** | Rejected | No install-prompt UX on iOS; EU push gap; no background sync APIs |
| **Capacitor + existing Next.js** | **Selected** | High solo-dev feasibility (2–3 weeks); inherits the entire mobile-aware web codebase; forward optionality preserved |
| **Expo (React Native managed)** | Rejected | 6–10 week rewrite; loses web code reuse; gold-standard mobile feel not justified at family scale |
| **Fully native iOS + Android** | Rejected | Two codebases for a solo dev; not viable |

### Selected Starter: Capacitor 7.x Wrap of Existing Next.js Codebase

**Rationale for Selection:**
- The web codebase already works and is in production with family users. Capacitor wraps it as a native shell — no rewrite.
- Capacitor inherits 100% of the existing React components, Tailwind styling, and business logic without modification.
- Forward optionality: if a specific screen needs native polish in v2+, individual screens can be ported to React Native via `react-native-web` patterns without abandoning Capacitor.

**Initialization Command** (first implementation story):

```bash
# From the existing Next.js repo root
npm install @capacitor/core @capacitor/cli
npx cap init "Simmer" "com.simmer.mobile" --web-dir=.next
npm install @capacitor/ios
npx cap add ios

# Install v1 plugin set
npm install \
  @capacitor/network \
  @capacitor/preferences \
  @capacitor/haptics \
  @capacitor/status-bar \
  @capacitor/splash-screen \
  @capacitor/app \
  @capacitor-community/secure-storage

# Install data layer
npm install \
  @tanstack/react-query \
  @tanstack/query-async-storage-persister \
  @tanstack/react-query-persist-client

# Sync native projects
npx cap sync ios
```

**Note:** Capacitor's `server.url` configuration in `capacitor.config.ts` points the WKWebView at the deployed Vercel domain (`https://simmer.vercel.app`) rather than bundling the Next.js output into the iOS binary. This makes server-rendered routes work natively and avoids the complexity of static-exporting the Next.js App Router.

### Architectural Decisions Provided by Starter

**Language & Runtime:** TypeScript 5.x strict mode (existing); Capacitor's JS runtime is the WKWebView itself — no separate Node runtime on device.

**Styling Solution:** Tailwind CSS v4 (existing) — inherited verbatim by Capacitor WKWebView.

**Build Tooling:**
- Web: `next build` (existing)
- iOS: Capacitor CLI → Xcode 16+ archive → TestFlight upload
- Single CI/CD path not configured for v1 (manual builds for family-scale rollout)

**Testing Framework:** None (existing repo has no test suite). Manual verification gates per NFR39–NFR43 substitute for automated tests.

**Code Organization:** Existing Next.js App Router conventions (per [docs/architecture.md](../../docs/architecture.md)) — `src/app/` for pages and API routes, `src/components/` flat, `src/lib/` for server-side helpers, `src/hooks/` for client hooks. **Mobile additions go in the same directories** — no parallel `mobile/` tree.

**Development Experience:** Existing `npm run dev` for web development unchanged. Mobile development adds `npx cap run ios` to launch a Simulator build, and `npx cap open ios` to open Xcode for real-device builds.

---

## Core Architectural Decisions

### Decision Priority Analysis

**Critical decisions (block implementation) — all resolved:**

1. Form factor: **Capacitor wrap** (per research)
2. Auth mechanism: **Bearer-token header alternative on existing `Session` table** (per research)
3. Offline strategy: **Read-only TanStack Query persistence** (per research)
4. Real-time mechanism: **30-second polling unchanged** (per research; push deferred to v2)
5. AI extraction UX: **Synchronous with Vercel Pro Fluid Compute** (per research; async deferred to v2)
6. iOS minimum version: **iOS 16+** (Capacitor 7 baseline)
7. Distribution channel: **TestFlight only** (per PRD scoping; public App Store deferred to v2)

**Important decisions (shape architecture):**

1. **Data fetching primitive: TanStack Query** — not in the existing web codebase; introduced for mobile to power offline cache. Used on mobile via Capacitor runtime check.
2. **Persistence backend: `@capacitor/preferences`** (NSUserDefaults on iOS) — sufficient for serialized TanStack Query state; no need for SQLite or larger storage in v1.
3. **Native code isolation: hooks over wrappers** — Capacitor APIs accessed exclusively via `src/hooks/use-*.ts` hooks that no-op on web.
4. **Server URL strategy: `server.url` in `capacitor.config.ts`** — WKWebView loads from deployed Vercel domain; no static-export of the Next.js build into the iOS binary.

**Deferred decisions (post-MVP / explicitly out of scope):**

- Push notification dispatcher (v2)
- Async recipe extraction via Inngest (v2)
- iOS Share Extension (v2)
- Android Capacitor build (v2)
- Crash reporting integration (v2, per NFR45)
- Analytics integration (v2, per NFR45)

### Data Architecture

**Database (unchanged):** PostgreSQL hosted, accessed via Prisma 7.4.2 with `@prisma/adapter-pg`. The existing 9-model schema (User, Session, Recipe, AISummaryJob, CookLog, SavedRecipe, FriendRequest, Partnership, FeedEvent) is the source of truth and requires no migrations for mobile v1.

**Data validation strategy:** Inherited — none formal at the API boundary. Bodies are read with `await request.json()` and passed directly to Prisma. Mobile clients are responsible for sending well-formed bodies. *Mobile-polish-backlog item:* introduce Zod validation at request boundaries — not blocking for v1.

**Caching strategy (mobile-only):**

- **Client cache:** TanStack Query as the primitive. `staleTime`:
  - 5 minutes for library list and feed list queries (refetch on next foreground or pull-to-refresh)
  - `Infinity` for recipe-detail queries (refetch only on explicit pull-to-refresh)
- **Persistence:** `@tanstack/query-async-storage-persister` backed by `@capacitor/preferences` (NSUserDefaults). Persisted on every cache update; rehydrated on app launch.
- **Cache size budget:** ~5 MB for 200 recipes (JSON only); image cache delegated to WKWebView's HTTP cache (additionally bounded to ~50 MB by iOS defaults)
- **Invalidation triggers:** logout (FR33), partner unlink (FR34), friend removal (FR34), friend-request decline (FR34), app foreground transition (FR23), network online transition (FR37), pull-to-refresh (FR38)
- **Failure mode:** persistence write failure falls back transparently to in-memory cache (FR43); no user-visible error

**Migration approach:** No mobile-driven migrations in v1. Future v2 work (push notifications) will add a `DeviceToken` table; coordinated mobile release per NFR44.

### Authentication & Security

**Authentication mechanism:** Dual-path on the existing `Session` table.

- **Web (unchanged):** httpOnly `auth-token` cookie + `auth-status` non-httpOnly cookie
- **Mobile (new):** `Authorization: Bearer <token>` header reading the same `Session.token` UUIDs

**Backend change (~10 LOC):** Extend `getCurrentUser()` in [src/lib/auth.ts](../../src/lib/auth.ts:38) to read `Authorization: Bearer <token>` as a fallback when no cookie is present. Identical session lookup downstream.

**Login/signup endpoint changes:** Return `{ user, token }` in the response body in addition to setting the existing cookie. Web ignores the body token; mobile reads it.

**Token lifecycle:**
- Web cookie: 7-day expiry, set on creation, refreshed on each login
- Mobile token: 30-day expiry, sliding-window refresh on each successful authenticated API call (NFR11)
- Server-side `Session.expiresAt` extended by 30 days on each successful Bearer-auth request; web cookie path unchanged
- Revocable at any time via `Session` row deletion

**Token storage on mobile:** iOS Keychain via `@capacitor-community/secure-storage` with access class `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly` (FR42, NFR10). Token survives device reboot once unlocked; does not sync to iCloud; does not survive app uninstall.

**Authorization patterns (unchanged):** Server-side per-route checks via `getCurrentUser()` plus per-recipe access logic in [src/app/api/recipes/[id]/route.ts](../../src/app/api/recipes/[id]/route.ts). Mobile client cannot bypass these (NFR14).

**API security strategy:**
- HTTPS-only via Vercel edge (NFR12)
- No CORS configuration changes needed — Capacitor `server.url` points at the same Vercel domain (same-origin)
- CSP `img-src` allowlist on `/recipes/[id]` pages (FR31) — restricts outbound image loads to known CDN domains + the recipe's source domain; defends against token exfiltration via extracted recipe content
- Server-side sanitization of extracted recipe content (FR32) — strip event handlers, inline scripts before storing in Postgres

**Data encryption:** TLS 1.2+ in transit (Vercel default). At-rest encryption handled by the managed Postgres provider. iOS Keychain provides hardware-backed encryption for tokens.

### API & Communication Patterns

**API design (unchanged):** REST-ish JSON over HTTPS. Next.js App Router route handlers (`route.ts`) export `GET`, `POST`, `PATCH`, `DELETE` named functions. Full endpoint catalog in [docs/api-contracts.md](../../docs/api-contracts.md).

**Wire format (unchanged):** JSON; tag array fields stored as JSON-encoded strings on the wire (`JSON.parse` on read, `JSON.stringify` on write). Mobile clients must use the same convention (NFR38).

**Error handling standards:**
- Server returns `{ "error": "<human-message>" }` with appropriate HTTP status code (existing)
- Mobile client surfaces these as inline / banner UI per P9 (errors explain user's next action, never status codes)
- Network failures distinguished from server failures at the TanStack Query layer

**Rate limiting strategy:** None in v1 (inherited gap). *Mobile-polish-backlog item:* add basic rate limiting on `/api/recipes/summarize` (Gemini cost) and `/api/auth/login` (credential brute force) — not blocking for family-scale v1.

**Versioning:** None — no API version in URL path. App-version forward compatibility (NFR44) is the contract: backend changes are additive; field types preserved; breaking changes require coordinated mobile release.

**Mobile client API conventions:**
- All API calls go through TanStack Query (queries for reads, mutations for writes)
- All authed requests attach `Authorization: Bearer <token>` from Keychain via the `apiClient` helper
- All responses pass through a single error-normalization function before reaching React components
- Optimistic UI updates use TanStack Query's `onMutate` / `onError` lifecycle (P5)

### Frontend Architecture

**Rendering strategy (unchanged):** Server components for pages and initial data fetches; `"use client"` components for state, effects, and mobile-specific behavior. Capacitor WKWebView renders the deployed Next.js output unmodified.

**State management:**
- **Server state:** TanStack Query (new — required for mobile offline cache)
- **Client state:** Local component state via `useState` / `useReducer` (existing pattern preserved)
- **No global state library** (no Redux, Zustand, Jotai, etc.) — inherited from web

**Component architecture (unchanged):** Flat `src/components/` directory; no feature-based subfolders. Generated Prisma types imported directly into client components (`@/generated/prisma/client`).

**Routing strategy (unchanged):** Next.js App Router file-based routing. iOS deep links not in v1 scope (deferred to v2 for push).

**Performance optimization:**
- TanStack Query's request deduplication and stale-while-revalidate (NFR1, NFR4)
- Optimistic UI for all writes (P5) — perceived latency < 100 ms even on slow networks
- App-resume cache invalidation runs in the background; users don't wait for it (NFR1)
- `prefers-reduced-motion` honored at the CSS level (no JS animation libraries)

**Bundle optimization (mobile-specific):**
- Capacitor plugins are tree-shaken via dynamic import in the native-only hooks
- TanStack Query persisted cache is the only runtime addition; ~10 KB gzipped delta
- WKWebView loads the same bundle that Vercel serves — no separate mobile bundle

**Web/mobile divergence boundary:** `Capacitor.isNativePlatform()` is the single runtime check. Hooks in `src/hooks/use-*.ts` no-op on web (return defaults or no-op functions). No conditional component rendering — same React tree on both platforms.

### Infrastructure & Deployment

**Hosting strategy (backend):** Vercel Pro with Fluid Compute enabled. Required for `maxDuration: 60` on `/api/recipes/summarize` (NFR8).

**Hosting strategy (mobile binary):** TestFlight for v1 distribution. Apple Developer Program enrollment required for long-lived TestFlight builds (90-day expiry instead of 7-day Apple-ID builds).

**CI/CD pipeline:**
- **Web:** Vercel's automatic Git integration (existing)
- **iOS v1:** Manual local builds via Capacitor CLI + Xcode. No EAS, no Fastlane, no GitHub Actions for iOS in v1. *Mobile-polish-backlog item:* add EAS or GitHub Actions iOS build automation when v2 distribution expands.

**Environment configuration:**
- `.env` files unchanged for backend (`DATABASE_URL`, `GEMINI_API_KEY`, `NODE_ENV`)
- Capacitor `server.url` configured per-environment in `capacitor.config.ts`:
  - Development: `http://localhost:3000` for local Next.js dev server
  - Production: `https://simmer.vercel.app` (or production domain)

**Monitoring and logging (explicit non-goal per NFR45):**
- **No crash reporting** (no Sentry, no Bugsnag) in v1 — deferred to v2
- **No analytics SDKs** (no PostHog, no Mixpanel) in v1 — deferred to v2
- **No structured logging** — existing `console.error` pattern preserved
- **Operational awareness:** founder subscribes to Vercel status page (NFR46)

**Scaling strategy:** N/A for family-scale v1. Vercel Pro scales automatically. Postgres connection pooling via the managed provider.

### Decision Impact Analysis

**Implementation sequence (binds to mobile-polish-backlog when conflicts arise):**

1. Install Capacitor + plugins + TanStack Query (one-time)
2. Implement Bearer-token auth on `Session` table (~10 LOC backend change) — verify with NFR40 smoke test before mobile is enabled
3. Configure `capacitor.config.ts` with production `server.url`
4. Create `src/lib/native.ts` runtime-check helper + Capacitor plugin imports
5. Implement `useNetworkState()` hook + `OfflineBanner` component
6. Wrap root layout in `SafeAreaLayout`
7. Install TanStack Query provider at root layout; configure persister with `@capacitor/preferences` backend
8. Migrate existing data-fetching from direct `fetch` to TanStack Query (per-route incremental migration)
9. Implement remaining hooks: `useHapticFeedback`, `useStatusBarMode`, `useAppResume`
10. Implement `CacheTimestamp` component
11. Produce native assets: app icon set, `LaunchScreen.storyboard`
12. CSP `img-src` header on `/recipes/[id]` pages + recipe-content sanitization in extraction pipeline
13. Real-device QA pass on founder's iPhone (NFR41) — gates TestFlight invite
14. TestFlight upload + family invites

**Cross-component dependencies:**

- Bearer-token auth must ship to production and pass NFR40 smoke test **before** any mobile client points at the production API
- `useNetworkState` is a hard dependency for every write-action component (`RecipeForm`, `FeedItem`, `RecipeDetail`, etc.) — implement first
- TanStack Query migration is a wide-touching change; preferably done in a single PR per-screen, not all at once
- CSP header and sanitization must both ship together — partial deployment leaves the security boundary porous

---

## Implementation Patterns & Consistency Rules

These rules prevent AI agents working on this codebase from making conflicting choices. Every pattern below has a single canonical answer.

### Naming Patterns

**Database (inherited from existing schema):**
- Tables: PascalCase singular (`User`, `Recipe`, `Session`) — Prisma convention
- Columns: camelCase (`userId`, `recipeId`, `cookCount`) — Prisma convention
- Foreign keys: `<entity>Id` (`userId`, `recipeId`)
- Indexes: Prisma-managed via `@@index([...])` directives
- Migration files: timestamp-prefixed snake_case under `prisma/migrations/`

**API:**
- Endpoints: plural nouns (`/api/recipes`, `/api/friends`, `/api/feed`)
- Route parameters: `[id]` in Next.js App Router file conventions
- Query parameters: camelCase (`?since=<ISO>`)
- HTTP headers: PascalCase per HTTP convention (`Authorization`, `Content-Type`)
- Error response: `{ "error": "<human-message>" }` (existing)
- Success response: bare entity or array (no envelope) — inherited

**Code:**
- React components: PascalCase file + export (`RecipeCard.tsx` exports `RecipeCard`)
- Hooks: camelCase with `use` prefix (`useNetworkState`, `useHapticFeedback`)
- File names for components: kebab-case (`recipe-card.tsx`) per existing repo convention — *deviates from typical PascalCase file naming; preserved for consistency with existing codebase*
- Lib utilities: kebab-case (`recipe-images.ts`, `auth.ts`)
- Functions: camelCase verbs (`getCurrentUser`, `extractRecipe`, `confirmCookLog`)
- Variables: camelCase (`recipeId`, `cookCount`)
- Constants: SCREAMING_SNAKE_CASE for true constants; camelCase for module-scoped configuration arrays (inherited pattern from `src/lib/constants.ts`)

### Structure Patterns

**Tests:** None in v1 (per existing repo state). Manual verification gates substitute.

**Component organization:** Flat `src/components/` directory; no feature subfolders. **Do not introduce subfolder taxonomy in v1** even though the directory has 16+ files post-mobile additions. *Mobile-polish-backlog item:* organize into subfolders if growth continues.

**Shared utilities:**
- Server-side helpers: `src/lib/*.ts`
- Client-side hooks: `src/hooks/use-*.ts`
- UI types: `src/types/*.ts`
- Constants: `src/lib/constants.ts` (existing)

**Configuration files:**
- `next.config.ts` — Next.js (existing)
- `prisma.config.ts` — Prisma (existing)
- `tsconfig.json` — TypeScript (existing)
- `tailwind.config` — implicit via `@tailwindcss/postcss` (existing)
- `eslint.config.mjs` — ESLint (existing)
- **NEW: `capacitor.config.ts`** — Capacitor (root level)

**Static assets:**
- Web: `public/` (existing)
- iOS native: `ios/App/App/Assets.xcassets/` (Capacitor-generated)

### Format Patterns

**API response wrappers:** None — direct entity / array (inherited).

**Error format:** `{ "error": "<human-readable message>" }` with appropriate HTTP status code (inherited). Mobile renders the error string directly in inline / banner UI per P9.

**Date/time format:** ISO 8601 strings in JSON (Prisma default). Client-side rendering uses `Intl.DateTimeFormat` for locale-aware display; "Updated N min ago" in `CacheTimestamp` uses `Intl.RelativeTimeFormat`.

**JSON field naming:** camelCase (matches Prisma model property names).

**Boolean representations:** `true` / `false` JSON booleans (inherited).

**Tag arrays on the wire:** JSON-encoded strings (e.g. `"seasonTags": "[\"Summer\",\"Fall\"]"`). **This is a wire-format quirk inherited from the existing API; mobile clients MUST `JSON.parse` on read and `JSON.stringify` on write.** Documented in [docs/data-models.md](../../docs/data-models.md).

**API status codes:**
- 200 OK — success with body
- 201 Created — POST success
- 400 Bad Request — malformed body or missing field
- 401 Unauthorized — no session / expired session
- 403 Forbidden — session valid but caller lacks access
- 404 Not Found — entity doesn't exist or caller can't see it (per existing visibility logic)
- 409 Conflict — uniqueness violation (duplicate email, duplicate friend request, etc.)
- 422 Unprocessable Entity — extraction failed with fallback flag
- 500 Internal Server Error — unexpected failure

### Communication Patterns

**Event naming (in-app, not pub/sub):**
- Feed event types: snake_case strings as enum values (`cook`, `cook_favorite`, `cook_discard`, `add_recipe`, `save_recipe`) — inherited from existing `FeedEvent.eventType`
- Capacitor plugin events: camelCase per plugin convention (`networkStatusChange`, `appStateChange`)

**State update patterns:**
- Server state: TanStack Query mutations with `onMutate` (optimistic) / `onError` (revert) / `onSuccess` (confirm) lifecycle
- Local state: standard React `setState` immutable updates
- No mutation of cached query data outside of TanStack Query's setQueryData API

**Action naming:** Verbs in present tense (`cookRecipe`, `saveRecipe`, `sendFriendRequest`).

**Logging:** `console.error` for unexpected failures (inherited). No structured logging in v1 per NFR45.

### Process Patterns

**Loading state handling (per UX spec Loading States section):**
- < 300 ms: show nothing
- 300 ms – 2 s: inline spinner in affected component
- 2 s+: progress text + spinner ("Summarizing your recipe…")
- Optimistic: show success state immediately

**Error recovery patterns:**
- Network failures: inline retry banner per P9
- Server failures: inline error per P9
- Auth failures: redirect to login screen with inline error (P9, FR18)
- Cache-write failures: silent fallback to in-memory (FR43)

**Retry implementation:**
- TanStack Query default retry (3 attempts, exponential backoff) for queries
- Mutations: NO automatic retry by default — user-initiated retry via the inline retry banner (avoids accidental duplicates)
- Exception: idempotent operations (e.g. cook-log POST with idempotency key — v2)

**Authentication flow patterns:**
- App launch → check Keychain for token → if present, attempt API call → if 401, clear Keychain + redirect to login → if success, proceed
- Login → POST `/api/auth/login` → receive `{ user, token }` → write token to Keychain → navigate to library
- Logout → DELETE `/api/auth/logout` → clear Keychain → call `queryClient.clear()` (FR33) → navigate to login

**Validation timing:**
- Client-side: at submit time (inline error per P9)
- Server-side: at endpoint entry (existing pattern)
- No "as you type" validation in v1 (inherited)

### Enforcement Guidelines

**All AI agents working on this codebase MUST:**

- Use TanStack Query for all data fetching in client components (do NOT introduce direct `fetch` calls in `"use client"` components)
- Access Capacitor APIs ONLY via the hooks in `src/hooks/use-*.ts` (do NOT import `@capacitor/*` directly in components)
- Use `Capacitor.isNativePlatform()` as the single runtime check for mobile-only behavior
- Preserve the JSON-encoded-string convention for tag arrays at the API wire boundary
- Follow the existing kebab-case file naming for components (deviates from PascalCase but is the established convention)
- Surface errors as inline / banner UI per P9 — never status codes, never modal-only error displays
- Add VoiceOver labels to every new interactive element (P8, NFR26)

**All AI agents working on this codebase MUST NOT:**

- Modify the Prisma schema in v1 (no migrations until v2)
- Introduce new top-level npm dependencies without documenting in `docs/mobile-parity-notes.md`
- Add new design tokens to `src/app/globals.css` (use existing tokens only — per UX spec Step 6)
- Skip the NFR39 dual-auth regression checklist before TestFlight enablement
- Bundle the Next.js static export into the iOS binary — Capacitor `server.url` points at deployed Vercel
- Introduce auto-retry on mutations (avoid accidental duplicate writes)

### Pattern Examples

**Good — TanStack Query mutation with optimistic UI:**

```typescript
const saveRecipe = useMutation({
  mutationFn: (recipeId: string) =>
    apiClient.post('/api/saved-recipes', { recipeId }),
  onMutate: async (recipeId) => {
    await queryClient.cancelQueries({ queryKey: ['saved-recipes'] });
    const previous = queryClient.getQueryData(['saved-recipes']);
    queryClient.setQueryData(['saved-recipes'], (old: any) => [...old, { recipeId }]);
    triggerHaptic('confirmSaveFromFeed');
    return { previous };
  },
  onError: (err, recipeId, context) => {
    queryClient.setQueryData(['saved-recipes'], context?.previous);
    showInlineError('Could not save. Try again.');
  },
});
```

**Good — Capacitor hook with web no-op:**

```typescript
// src/hooks/use-haptic-feedback.ts
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export function useHapticFeedback() {
  const confirmCookLog = async () => {
    if (!Capacitor.isNativePlatform()) return;
    await Haptics.impact({ style: ImpactStyle.Medium });
  };
  // ... confirmSaveFromFeed, confirmPartnerUnlink similarly
  return { confirmCookLog, confirmSaveFromFeed, confirmPartnerUnlink };
}
```

**Anti-pattern — direct fetch in a client component:**

```typescript
// ❌ DO NOT
"use client";
export function MyComponent() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('/api/recipes').then(r => r.json()).then(setData);
  }, []);
  // Loses offline cache, no optimistic UI, no error normalization
}
```

**Anti-pattern — direct Capacitor import in a component:**

```typescript
// ❌ DO NOT
"use client";
import { Haptics } from '@capacitor/haptics';
export function CookButton() {
  const onCook = () => {
    Haptics.impact(); // Breaks on web; no isNativePlatform check
  };
}
```

---

## Project Structure & Boundaries

### Complete Project Directory Structure

```
simmer/
├── README.md
├── package.json                       # Adds: @capacitor/*, @tanstack/react-query, @tanstack/query-async-storage-persister
├── package-lock.json
├── next.config.ts                     # CSP img-src header added for /recipes/[id]
├── prisma.config.ts                   # unchanged
├── eslint.config.mjs                  # unchanged
├── postcss.config.mjs                 # unchanged
├── tsconfig.json                      # unchanged
├── middleware.ts                      # unchanged
├── capacitor.config.ts                # NEW — server.url, plugin config
│
├── prisma/                            # unchanged (no v1 migrations)
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
│
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── layout.tsx                 # MODIFIED — wraps in SafeAreaLayout + QueryClientProvider + PersistQueryClientProvider
│   │   ├── page.tsx                   # unchanged
│   │   ├── globals.css                # unchanged
│   │   ├── login/page.tsx             # unchanged
│   │   ├── signup/page.tsx            # unchanged
│   │   ├── feed/page.tsx              # MODIFIED — TanStack Query migration
│   │   ├── friends/page.tsx           # MODIFIED — TanStack Query migration
│   │   ├── recipes/
│   │   │   ├── new/page.tsx           # MODIFIED — TanStack Query migration
│   │   │   └── [id]/
│   │   │       ├── page.tsx           # MODIFIED — adds CacheTimestamp, CSP meta tag
│   │   │       └── edit/page.tsx      # MODIFIED — TanStack Query migration
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── login/route.ts     # MODIFIED — returns token in body
│   │       │   ├── logout/route.ts    # unchanged
│   │       │   └── signup/route.ts    # MODIFIED — returns token in body
│   │       ├── recipes/
│   │       │   ├── route.ts           # unchanged (auth via getCurrentUser inherits Bearer)
│   │       │   ├── summarize/route.ts # MODIFIED — server-side recipe content sanitization
│   │       │   └── [id]/
│   │       │       ├── route.ts       # unchanged
│   │       │       └── cook/route.ts  # unchanged
│   │       ├── feed/route.ts          # unchanged
│   │       ├── friends/
│   │       │   ├── route.ts           # unchanged
│   │       │   ├── search/route.ts    # unchanged
│   │       │   └── requests/
│   │       │       ├── route.ts       # unchanged
│   │       │       └── [id]/route.ts  # unchanged
│   │       ├── partner/
│   │       │   ├── route.ts           # unchanged
│   │       │   └── requests/route.ts  # unchanged
│   │       ├── saved-recipes/route.ts # unchanged
│   │       └── onboarding/route.ts    # unchanged
│   │
│   ├── components/                    # Flat — existing pattern preserved
│   │   ├── nav-bar.tsx                # MODIFIED — safe-area-aware padding
│   │   ├── logout-button.tsx          # MODIFIED — clears Keychain + queryClient.clear()
│   │   ├── onboarding-modal.tsx       # unchanged
│   │   ├── recipe-library.tsx         # MODIFIED — TanStack Query for library + saved + partner
│   │   ├── recipe-card.tsx            # unchanged
│   │   ├── recipe-detail.tsx          # MODIFIED — useStatusBarMode + useHapticFeedback + CacheTimestamp
│   │   ├── recipe-form.tsx            # MODIFIED — useNetworkState disables submit when offline
│   │   ├── search-bar.tsx             # unchanged
│   │   ├── filter-panel.tsx           # unchanged
│   │   ├── feed-list.tsx              # MODIFIED — TanStack Query replaces useFeedPolling internals
│   │   ├── feed-item.tsx              # MODIFIED — useHapticFeedback on save action
│   │   ├── friend-requests.tsx        # unchanged
│   │   ├── friend-search.tsx          # unchanged
│   │   ├── partner-section.tsx       # MODIFIED — useHapticFeedback on unlink + cache invalidation
│   │   ├── offline-banner.tsx         # NEW — FR21, FR37, FR39
│   │   ├── cache-timestamp.tsx        # NEW — FR22
│   │   └── safe-area-layout.tsx       # NEW — FR46
│   │
│   ├── hooks/
│   │   ├── use-feed-polling.ts        # MODIFIED — replaced by TanStack Query refetchInterval; file may be removed
│   │   ├── use-wake-lock.ts           # unchanged — works in WKWebView
│   │   ├── use-network-state.ts       # NEW — wraps @capacitor/network; falls back to navigator.onLine on web
│   │   ├── use-haptic-feedback.ts     # NEW — wraps @capacitor/haptics; no-ops on web
│   │   ├── use-status-bar-mode.ts     # NEW — wraps @capacitor/status-bar
│   │   └── use-app-resume.ts          # NEW — wraps @capacitor/app; triggers queryClient.invalidateQueries
│   │
│   ├── lib/
│   │   ├── auth.ts                    # MODIFIED — getCurrentUser accepts Authorization header; sliding 30d expiry for mobile tokens
│   │   ├── prisma.ts                  # unchanged
│   │   ├── friends.ts                 # unchanged
│   │   ├── partner.ts                 # unchanged
│   │   ├── ai.ts                      # unchanged
│   │   ├── extract.ts                 # MODIFIED — sanitizes extracted content before returning
│   │   ├── recipe-images.ts           # unchanged
│   │   ├── constants.ts               # unchanged
│   │   ├── native.ts                  # NEW — Capacitor.isNativePlatform() helpers + plugin import barrels
│   │   ├── api-client.ts              # NEW — fetch wrapper that attaches Authorization header from Keychain
│   │   └── query-client.ts            # NEW — TanStack Query client + persister configuration
│   │
│   ├── types/
│   │   └── recipe.ts                  # unchanged
│   │
│   └── generated/
│       └── prisma/                    # unchanged (gitignored)
│
├── public/                            # unchanged
│
├── ios/                               # NEW — Capacitor-generated; checked into git per Capacitor convention
│   └── App/
│       ├── App.xcworkspace/
│       ├── App.xcodeproj/
│       ├── Podfile
│       └── App/
│           ├── Info.plist             # ITSAppUsesNonExemptEncryption: NO; App Privacy declarations
│           ├── AppDelegate.swift      # Capacitor-generated
│           ├── LaunchScreen.storyboard # MODIFIED — custom brand splash (FR9)
│           ├── Main.storyboard        # Capacitor-generated
│           └── Assets.xcassets/
│               ├── AppIcon.appiconset/ # NEW — all iOS sizes (FR10)
│               └── Splash.imageset/    # NEW — splash background image
│
├── docs/                              # Project docs (read by AI agents)
│   ├── architecture.md                # Existing — web codebase scan
│   ├── api-contracts.md               # Existing — keep updated as backend changes
│   ├── data-models.md                 # Existing — keep updated as schema changes (none in v1)
│   ├── component-inventory.md         # Existing — UPDATE after mobile components ship
│   ├── source-tree-analysis.md        # Existing — UPDATE after mobile additions
│   ├── development-guide.md           # Existing — UPDATE with Capacitor build steps
│   ├── project-overview.md            # Existing
│   ├── index.md                       # Existing
│   ├── dual-auth-regression-checklist.md  # NEW — per NFR39
│   ├── mobile-parity-notes.md         # NEW — per NFR42
│   └── mobile-polish-backlog.md       # NEW — per UX spec meta-rule
│
├── _bmad/                             # BMAD method config (unchanged)
├── _bmad-output/                      # BMAD outputs
│   └── planning-artifacts/
│       ├── product-brief-Simmer.md    # existing
│       ├── prd.md                     # web PRD (existing)
│       ├── prd-mobile.md              # mobile PRD (existing)
│       ├── ux-design-specification-mobile.md  # mobile UX (existing)
│       ├── architecture-mobile.md     # THIS DOCUMENT
│       └── research/
│           └── technical-simmer-mobile-app-decisions-research-2026-05-09.md
└── Context/                           # unchanged
```

### Architectural Boundaries

**API Boundaries:**
- All 16 existing endpoints under `src/app/api/` accept both cookie (web) and Bearer-token header (mobile) authentication after the dual-auth modification. **No new endpoints in v1.**
- Inbound boundary: Vercel edge handles HTTPS termination, routing, and `maxDuration: 60` for the summarize endpoint
- Outbound boundary: Gemini API (server-side only via `@google/genai`); URL fetching for recipe extraction (server-side via `linkedom`); recipe-source image domains (CSP-allowed only for `img-src` on `/recipes/[id]`)

**Component Boundaries:**
- **Server components** read directly from Prisma and pass props to client components — unchanged inheritance pattern
- **Client components** (`"use client"`) get data exclusively via TanStack Query hooks, never via direct `fetch`
- **Mobile-only hooks** (`use-network-state`, `use-haptic-feedback`, `use-status-bar-mode`, `use-app-resume`) encapsulate Capacitor API surface — no Capacitor imports leak into component JSX
- **`SafeAreaLayout`** is the only mobile-only layout wrapper; it sits at the root level

**Service Boundaries:**
- `src/lib/auth.ts` — single source of truth for `getCurrentUser()`; receives dual-auth modification
- `src/lib/api-client.ts` — single source of truth for outbound HTTP requests from the client; attaches Authorization header on native
- `src/lib/query-client.ts` — single source of truth for TanStack Query client + persister configuration
- `src/lib/native.ts` — single source of truth for Capacitor runtime detection and plugin barrels
- `src/lib/extract.ts` — recipe extraction pipeline; receives content-sanitization modification

**Data Boundaries:**
- Prisma is the only path from the server to Postgres — never raw SQL in v1
- TanStack Query is the only path from the client to the API in client components
- `@capacitor/preferences` (via the TanStack Query persister) is the only persistent client-side storage
- iOS Keychain (via `@capacitor-community/secure-storage`) is the only storage for the session token — never `localStorage`, never cookies on mobile

### Requirements to Structure Mapping

**Mobile App Distribution & Installation (FR8–FR10):**
- TestFlight install → `ios/App/` Xcode project + Apple Developer account
- Native iOS launch screen → `ios/App/App/LaunchScreen.storyboard`
- Custom native app icon → `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

**Mobile Authentication & Session Persistence (FR11–FR18, FR42):**
- All endpoints accept Authorization header → `src/lib/auth.ts` (`getCurrentUser` modification)
- Login/signup return token in body → `src/app/api/auth/login/route.ts`, `src/app/api/auth/signup/route.ts`
- Token persistence in Keychain → `src/lib/native.ts` (`secureStorage` helper)
- 30-day sliding-window expiry → `src/lib/auth.ts` (session refresh on each successful Bearer auth)
- Logout clears Keychain + cache → `src/components/logout-button.tsx`
- Redirect to login on rejected token → `src/lib/api-client.ts` (401 interceptor)
- Keychain access class → `src/hooks/use-secure-storage.ts` (or directly in `src/lib/native.ts`)

**Offline Reading & Cache (FR19–FR24, FR37–FR39, FR43–FR44):**
- Cache library / partner / saved / feed events → `src/lib/query-client.ts` + per-query staleTime configuration
- Cache recipe details after first view → query-key strategy in `src/lib/api-client.ts`
- Offline banner → `src/components/offline-banner.tsx`
- "Updated N min ago" timestamp → `src/components/cache-timestamp.tsx`
- App-resume invalidation → `src/hooks/use-app-resume.ts` mounted at root layout
- Write actions disabled offline → consumers of `src/hooks/use-network-state.ts` (RecipeForm, FeedItem, etc.)
- Network transition cache refresh → `src/hooks/use-network-state.ts` (effect on online state)
- Pull-to-refresh → per-list-component native pull gesture (libraries: none added; CSS overflow-scroll behavior)
- Non-dismissible offline banner → `src/components/offline-banner.tsx` (no dismiss UI)
- Cache write failure → TanStack Query persister default behavior (transparent fallback)
- Stale-cache server-deleted handling → TanStack Query `onError` handler + per-route 404 response interpretation

**Mobile Kitchen / Cook Mode (FR25–FR27):**
- Cook mode entry/exit → existing `src/components/recipe-detail.tsx` (inherited from web)
- Wake lock → existing `src/hooks/use-wake-lock.ts` (works in WKWebView)
- Status bar dimming → `src/hooks/use-status-bar-mode.ts` called from `recipe-detail.tsx` on cook-mode toggle

**Native Haptic Feedback (FR28–FR30):**
- Cook log → `src/hooks/use-haptic-feedback.ts` `.confirmCookLog()` invoked in `recipe-detail.tsx`
- Save from feed → `.confirmSaveFromFeed()` invoked in `feed-item.tsx`
- Partner unlink → `.confirmPartnerUnlink()` invoked in `partner-section.tsx`

**Security & Privacy (FR31–FR35, FR45):**
- CSP `img-src` → `next.config.ts` headers configuration for `/recipes/[id]` route group
- Recipe content sanitization → `src/lib/extract.ts` (sanitize before returning structured recipe data)
- `queryClient.clear()` on logout → `src/components/logout-button.tsx`
- Cache invalidation on access-control changes → consumers of TanStack Query invalidation (partner unlink, friend removal, friend-request decline mutations)
- iOS App Privacy declaration → `ios/App/App/Info.plist` (NSPrivacyAccessedAPITypes + privacy manifest)
- CSP-blocked image fallback → existing `src/lib/recipe-images.ts` chain (no modification needed; already deterministic)

**Mobile Navigation & UX (FR36, FR40, FR46–FR47):**
- First-launch flow → root layout decides login screen vs. library based on Keychain presence; `OnboardingModal` renders based on `User.hasSeenOnboarding`
- iOS swipe-back gesture → WKWebView default behavior; no code needed
- Safe-area insets → `src/components/safe-area-layout.tsx` + CSS `env(safe-area-inset-*)`
- Dark mode → existing Tailwind dark-mode classes inherited; WKWebView respects `prefers-color-scheme`

### Integration Points

**Internal communication:**
- **React tree:** server components → client components via props; client components → server via TanStack Query mutations
- **Hooks ↔ Capacitor plugins:** all bridge through `src/lib/native.ts`
- **Mutations ↔ Cache invalidation:** TanStack Query's `queryClient.invalidateQueries` calls
- **App lifecycle:** `useAppResume()` listener mounted once at root layout

**External integrations:**
- **Vercel-hosted Next.js backend** (sole integration target; same-origin under Capacitor's `server.url`)
- **Gemini API** (server-side only — mobile never calls directly)
- **iOS system frameworks** (via Capacitor plugins): Keychain Services, NSUserDefaults, UIKit (status bar, haptics), CoreHaptics, UIWebView/WKWebView, UIApplication (background state)

**Data flow:**

```
[iOS device] → WKWebView → Capacitor bridge → Capacitor plugins (Network, Preferences, Haptics, etc.)
            ↓                                ↑
            JS runtime ────────────── React components ←─ TanStack Query ─→ apiClient ─→ Vercel API (with Bearer header)
                                                                                          ↓
                                                                                       Prisma ─→ Postgres
                                                                                          ↓
                                                                                       Gemini API
```

### File Organization Patterns

**Configuration files:** root-level only (`capacitor.config.ts`, `next.config.ts`, etc.). No nested config except Capacitor's own `ios/App/App/` native config.

**Source organization:** All TypeScript/TSX in `src/`. Mobile-only files live alongside web files in the same `src/` directories (`src/hooks/`, `src/lib/`, `src/components/`) — no `src/mobile/` parallel tree.

**Test organization:** N/A (no test suite in v1). When automated tests are added in v2, the convention will be `*.test.ts` co-located with source files (Jest / Vitest convention).

**Asset organization:**
- Web static: `public/`
- iOS native: `ios/App/App/Assets.xcassets/` (Capacitor-managed)

### Development Workflow Integration

**Development server:**
- Web: `npm run dev` → `http://localhost:3000` (existing)
- Mobile (iOS Simulator): `npx cap run ios` (builds, syncs, opens Simulator)
- Mobile (real device): `npx cap open ios` → Xcode build to attached iPhone

**Build process:**
- Web: `npm run build` → Vercel auto-deploy on push to main
- iOS: Xcode archive → upload to App Store Connect → TestFlight build available within ~15 minutes

**Deployment:**
- Web (production): automatic on push to main via Vercel
- Mobile (TestFlight): manual archive + upload via Xcode for v1; family invitees notified by TestFlight

---

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
- Capacitor 7.x supports Next.js 16 (verified via [NextNative](https://nextnative.dev/comparisons/nextjs-vs-expo) in research)
- TanStack Query 5.x works with React 19 (released with React 19 in mind)
- All Capacitor plugins in the v1 set are compatible with Capacitor 7
- iOS 16+ is the floor that supports all plugins used
- No version conflicts identified

**Pattern Consistency:**
- Naming patterns inherited from existing repo (kebab-case files, camelCase code)
- TanStack Query as the universal data primitive for client components is consistent with the Capacitor offline-cache requirement
- Hook-based Capacitor isolation is consistent across all 4 hooks (`useNetworkState`, `useHapticFeedback`, `useStatusBarMode`, `useAppResume`)

**Structure Alignment:**
- All mobile additions live in existing directory conventions (no parallel `mobile/` tree)
- `ios/` directory is new but Capacitor-managed
- Documentation lives in `docs/` consistently (existing + 3 new files)

### Requirements Coverage Validation ✅

**FR Coverage (47 FRs):**

| Section | FRs | Coverage |
|---|---|---|
| Inherited Web Capabilities | FR1–FR7, FR41 | Inherited Next.js codebase + touch-only verification gate at QA |
| Mobile App Distribution & Installation | FR8–FR10 | iOS Xcode project + native assets |
| Mobile Authentication & Session | FR11–FR18, FR42 | `src/lib/auth.ts` modification + Keychain via Capacitor Secure Storage |
| Offline Reading & Cache | FR19–FR24, FR37–FR39, FR43–FR44 | TanStack Query + persister + custom hooks |
| Mobile Kitchen / Cook Mode | FR25–FR27 | Existing wake lock hook + new status bar hook |
| Native Haptic Feedback | FR28–FR30 | `useHapticFeedback` hook with 3 named functions |
| Security & Privacy | FR31–FR35, FR45 | CSP header + sanitization + cache clear on logout + privacy declaration |
| Mobile Navigation & UX | FR36, FR40, FR46–FR47 | First-launch logic + SafeAreaLayout + inherited dark-mode classes |

**All 47 FRs have an architectural home.** ✅

**NFR Coverage (45 NFRs):**

| Category | NFRs | Coverage |
|---|---|---|
| Performance | NFR1–NFR8 | TanStack Query staleTime configuration; cold-start budget; cook-mode wake lock acquire; pull-to-refresh; Vercel Pro Fluid Compute |
| Security | NFR9–NFR15 | Server-side `getCurrentUser` enforcement; Keychain access class; HTTPS; CSP; sanitization |
| Reliability | NFR16–NFR21 | Directional target (NFR45 makes the no-measurement posture explicit); optimistic UI; TanStack Query fallback; Vercel uptime SLA inherited |
| Resource Consumption | NFR22, NFR25 | Directional targets; foreground-only polling per existing `useFeedPolling` visibility check |
| Accessibility | NFR26–NFR29 | VoiceOver labels on new components; Dynamic Type via Tailwind responsive typography; 44pt targets; WCAG AA palette |
| App Store Compliance | NFR30–NFR34 | App Privacy declarations in Info.plist; encryption export declaration; native polish budget; TestFlight beta review |
| Integration | NFR35–NFR38 | Single backend; Gemini server-side; Capacitor plugin set documented; wire format preserved |
| Test Surface | NFR39–NFR43 | Manual checklists (NEW: `docs/dual-auth-regression-checklist.md`, `docs/mobile-parity-notes.md`); founder iPhone QA pass |
| Operations | NFR44–NFR47 | Additive wire-format contract; explicit non-measurement posture; Vercel status page subscription; iOS major release review cadence |

**All 45 NFRs have an architectural home.** ✅

### Implementation Readiness Validation ✅

**Decision Completeness:**
- All critical decisions documented with verified versions (Capacitor 7.x, Next.js 16.1.6, TanStack Query 5.x, iOS 16+)
- Patterns are comprehensive (naming, structure, format, communication, process)
- Enforcement rules listed for AI agents
- Code examples provided for the two most likely error modes (direct fetch in client component, direct Capacitor import)

**Structure Completeness:**
- Complete directory tree showing both existing files (unchanged / modified) and new files
- All v1 new files have a designated location
- Integration points explicitly mapped
- Component boundaries defined via hook isolation rules

**Pattern Completeness:**
- Conflict points (naming, structure, format, communication, process) all addressed
- Anti-patterns explicitly listed with reasoning
- Cross-cutting concerns (auth, offline, security, accessibility) all mapped to architectural responses

### Gap Analysis Results

**Critical gaps: NONE.** All requirements are architecturally supported; all critical decisions are resolved.

**Important gaps:**

1. **Capacitor server.url tradeoff:** Loading the WebView from `https://simmer.vercel.app` means the app cannot function pre-login if the Vercel domain is unreachable. Acceptable for v1 (family-scale, login required anyway) but worth noting. *Mobile-polish-backlog candidate:* offline-first first-launch experience that bundles the login screen statically.

2. **TanStack Query introduction is a wide-touching migration.** Every client component currently using direct `fetch` will need migration. Recommendation: ship the dual-auth backend + Capacitor bootstrap first; migrate to TanStack Query incrementally per-screen. Each screen's migration can be independently verified.

3. **No automated test coverage for the dual-auth regression checklist.** NFR39 is a manual gate. *Mobile-polish-backlog candidate:* a minimal API integration test suite covering the 16 endpoints × 2 auth paths — not blocking for v1 but ages poorly.

**Nice-to-have gaps:**

- Zod validation at API request boundaries (referenced in patterns section as a backlog item)
- API rate limiting (referenced in patterns section as a backlog item)
- Component library extraction (already noted in UX spec Step 6)
- Crash reporting + analytics SDK integration (explicitly deferred to v2 per NFR45)

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed (47 FRs + 45 NFRs)
- [x] Scale and complexity assessed (medium, family-scale, solo-dev)
- [x] Technical constraints identified (no schema migrations, Vercel Pro, iOS 16+, Apple Developer enrollment)
- [x] Cross-cutting concerns mapped (dual-path auth, offline-first read, native shell isolation, content security, iOS HIG, store review)

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed (cold start, cache hits, optimistic UI)

**✅ Implementation Patterns**
- [x] Naming conventions established (inherited + clarified)
- [x] Structure patterns defined (flat components, hooks for Capacitor)
- [x] Communication patterns specified (TanStack Query for server state, local state for UI)
- [x] Process patterns documented (loading, error, retry, auth flow)

**✅ Project Structure**
- [x] Complete directory structure defined with new/modified/unchanged annotations
- [x] Component boundaries established (hook isolation, single sources of truth)
- [x] Integration points mapped (internal + external + data flow diagram)
- [x] Requirements-to-structure mapping complete (every FR has a file)

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** **High** — the technical research pre-resolved the high-stakes decisions; the PRD and UX spec are well-aligned; the existing codebase is the proven base; mobile additions are well-bounded (8 components / hooks + ~10 LOC backend change).

**Key Strengths:**

- All architectural decisions trace back to either the technical research or the PRD/UX, which themselves trace back to user needs and business objectives
- Inheritance posture ("packaging shift, not rewrite") keeps the surface area small and reviewable
- Hook-based Capacitor isolation makes the web/mobile divergence boundary single-point and testable
- Manual verification gates (NFR39–NFR43) are an honest substitute for missing test coverage at family scale
- No new schema migrations means data layer risk is essentially zero

**Areas for Future Enhancement (post-v1):**

- Automated test coverage for the dual-auth path
- Crash reporting + analytics integration (deferred to v2 per NFR45)
- Push notification dispatcher (v2)
- Async recipe extraction via Inngest (v2)
- Android Capacitor build (v2)
- API rate limiting and Zod validation (mobile-polish-backlog)

### Implementation Handoff

**AI Agent Guidelines:**

- Follow all architectural decisions in this document exactly. Do not introduce alternatives without a documented reason captured in `docs/mobile-polish-backlog.md`.
- Use implementation patterns consistently across all components. The patterns section is binding.
- Respect project structure and boundaries. New code lives in the directories specified in the project tree; no parallel `mobile/` tree.
- Refer to the PRD ([prd-mobile.md](prd-mobile.md)) for *what to build*, the UX spec ([ux-design-specification-mobile.md](ux-design-specification-mobile.md)) for *how it should feel and behave*, and this architecture document for *how it's structured and named*.
- When in doubt, prefer inheritance from the existing web codebase over invention.

**First Implementation Priority:**

```bash
# Initialize Capacitor in the existing repo
npm install @capacitor/core @capacitor/cli
npx cap init "Simmer" "com.simmer.mobile" --web-dir=.next
npm install @capacitor/ios
npx cap add ios
```

Then proceed with the implementation sequence documented in [Decision Impact Analysis](#decision-impact-analysis).

---

## Workflow Complete

This architecture document is the single source of truth for Simmer Mobile v1 implementation. All architectural decisions are documented and validated; all 47 FRs and 45 NFRs have explicit architectural support; the project structure is concrete; implementation patterns prevent AI agent conflicts.

🎉 **Architecture complete.** Ready for epic breakdown via `/bmad-create-epics-and-stories` and subsequent implementation.
