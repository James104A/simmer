---
stepsCompleted: ["step-01-validate-prerequisites", "step-02-design-epics", "step-03-create-stories", "step-04-final-validation"]
inputDocuments:
  - "_bmad-output/planning-artifacts/prd-mobile.md"
  - "_bmad-output/planning-artifacts/architecture-mobile.md"
  - "_bmad-output/planning-artifacts/ux-design-specification-mobile.md"
  - "_bmad-output/planning-artifacts/product-brief-Simmer.md"
  - "_bmad-output/planning-artifacts/research/technical-simmer-mobile-app-decisions-research-2026-05-09.md"
project_name: "Simmer Mobile"
scope: "mobile-app-v1"
status: "complete"
completedAt: "2026-05-13"
totalEpics: 7
totalStories: 74
---

# Simmer Mobile - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for **Simmer Mobile v1** — a Capacitor 7.x iOS wrap of the existing Simmer Next.js web app, decomposing requirements from the mobile PRD (47 FRs, 47 NFRs), the mobile UX Design Specification (9 Experience Principles + 5 Emotional Principles + 8 mobile-only artifacts), and the mobile Architecture Decision Document into implementable stories.

**Scope reminder (v1):** iOS-only via TestFlight; Bearer-token auth alongside existing cookie auth; read-only offline cache via TanStack Query; native polish (splash, icon, haptics, status bar, safe areas); inherited web feature set. **Explicitly out of scope for v1:** Android, push notifications, async extraction, offline writes, iOS Share Extension, public App Store release.

## Requirements Inventory

### Functional Requirements

#### Inherited Web App Capabilities (Mobile-Wrapped)

The mobile app preserves all 39 web-PRD FRs as inherited capability areas. These are referenced by area, not re-decomposed:

- **FR1: Recipe management** — create linked or native recipes, edit, delete, add personal notes, tag with all six tag categories, browse, full-text search, filter (AND-across-categories / OR-within-category), sort.
- **FR2: Go-to signals** — numeric rating, mark cooked, favorite/pin, "want to try" list, signals visible on cards and detail views.
- **FR3: AI recipe extraction** — paste URL, review/edit AI fields, manual paste fallback, regenerate summary, automatic image extraction from source.
- **FR4: Partner vault** — send partner invite, accept/decline, co-own shared collection, merge recipes on link, unlink.
- **FR5: Friend connections** — search by email, send friend request, accept/decline incoming, view friends, remove friend.
- **FR6: Activity feed** — chronological feed of mutual friends' activity, cook / cook_favorite / cook_discard / add_recipe / save_recipe events, tap to view recipe, near-real-time updates via 30s polling, save-from-feed to "want to try".
- **FR7: Account & authentication** — sign up, sign in, manage profile (display name, email).
- **FR41: Touch-only operability** — all inherited capabilities (FR1–FR7) must be operable via touch-only iOS interactions; no hover-dependent affordances, no right-click, no keyboard-only paths.

#### Mobile App Distribution & Installation

- **FR8:** Users can install Simmer Mobile on their iPhone via a TestFlight invitation link.
- **FR9:** System displays a native iOS launch screen (LaunchScreen.storyboard) before the app's WKWebView mounts.
- **FR10:** System displays a custom native app icon on the iOS home screen (all required iOS sizes for iPhone and iPad).

#### Mobile Authentication & Session Persistence

- **FR11:** All API endpoints that require authentication accept `Authorization: Bearer <token>` as an alternative to the existing `auth-token` cookie (dual-auth path; cookie remains the primary for web).
- **FR12:** System login and signup endpoints return the `Session.token` in the response body in addition to setting the existing `auth-token` cookie.
- **FR13:** Mobile users can authenticate using the same email/password credentials as the web app.
- **FR14:** System persists the user's session token in iOS Keychain via Capacitor Secure Storage.
- **FR15:** System attaches the persisted session token in an `Authorization: Bearer <token>` header on every authenticated API request.
- **FR16:** System issues mobile-acquired session tokens with a 30-day expiry, refreshed on each successful API call (sliding-window).
- **FR17:** Users can sign out from the mobile app, which clears the session token from iOS Keychain and clears the local offline cache.
- **FR18:** System redirects to the login screen if the persisted session token is rejected (revoked or expired) by the server.
- **FR42:** System persists the session token in iOS Keychain using the `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly` access class. (Token survives device reboot once unlocked; does not sync to iCloud; does not survive app uninstall.)

#### Offline Reading & Cache

- **FR19:** System caches the current user's recipe library, partner vault, saved recipes ("want to try"), and the last 50 feed events to local persistent storage after the user first views them online.
- **FR20:** System caches any recipe detail page previously viewed online and renders it from cache when the device is offline.
- **FR21:** System displays a persistent "You're offline — showing cached recipes" banner whenever the device has no network connection.
- **FR22:** System displays an "Updated *N* minutes ago" timestamp on recipe detail views indicating cache freshness.
- **FR23:** System invalidates and refetches the user's library and feed queries when the app returns to the foreground after being backgrounded.
- **FR24:** System disables write actions (log a cook, save a recipe, send a friend or partner request, create or edit a recipe) when the device is offline and displays a "Connect to save" inline message on each disabled control.
- **FR37:** System automatically triggers a cache refresh and dismisses the offline banner when the device transitions from offline to online.
- **FR38:** Users can manually trigger a cache refresh via pull-to-refresh on the library, feed, and recipe detail views.
- **FR39:** The offline banner is non-dismissible during offline state — it dismisses automatically only when network returns.
- **FR43:** System handles offline cache write failures (storage full, persistence corruption, schema mismatch on app upgrade) by transparently falling back to in-memory cache without surfacing errors to the user.
- **FR44:** When the user taps a cached recipe that no longer exists on the server (deleted by owner), the app displays a "This recipe is no longer available" message and removes the stale entry from the cache.

#### Mobile Kitchen / Cook Mode

- **FR25:** Users can enter and exit cook mode from any recipe detail view they can access (own, partner's, friend's, or saved).
- **FR26:** System holds the iPhone's screen awake using the Screen Wake Lock API while cook mode is active, releasing the lock when the user exits cook mode or backgrounds the app.
- **FR27:** System styles the status bar to match the cook-mode theme while cook mode is active.

#### Native Haptic Feedback

- **FR28:** System triggers haptic feedback when the user marks a recipe as cooked.
- **FR29:** System triggers haptic feedback when the user saves a recipe from the feed to their "want to try" list.
- **FR30:** System triggers haptic feedback when the user unlinks a partner connection.

#### Security & Privacy (Mobile)

- **FR31:** System enforces a Content-Security-Policy `img-src` restriction on recipe detail pages, limiting outbound image loads to an explicit allowlist (known CDN domains plus the recipe's source domain).
- **FR32:** System sanitizes extracted recipe content (strips event handlers and inline scripts) before storing it in the database.
- **FR33:** System clears the entire offline cache (`queryClient.clear()`) when the user signs out.
- **FR34:** System invalidates relevant offline cache entries when a partner is unlinked, a friend is removed, or a friend request is declined (keeps cache consistent with access-control changes).
- **FR35:** System discloses data collection in the iOS App Privacy declaration: email and name (account + friend search), recipe content (user-generated), cook logs and ratings (user activity), partner and friend relationships (social graph). None used for tracking; none shared with third parties.
- **FR45:** When a recipe's source image is blocked by CSP or fails to load, the system renders the existing deterministic image fallback chain (cuisine → dish → protein → gradient hash from `src/lib/recipe-images.ts`).

#### Mobile Navigation & UX

- **FR36:** First-launch flow — if no persisted session exists, the app shows the login screen; on successful login, the app shows the existing `OnboardingModal` if the user's `hasSeenOnboarding` is false; otherwise routes directly to the library.
- **FR40:** iOS swipe-from-left-edge back gesture works on all nested navigation flows (recipe detail, friends, settings, friend search, recipe form).
- **FR46:** System honors iOS safe-area insets — bottom tab navigation renders above the home indicator; top content renders below the notch / Dynamic Island; status bar respects safe-area top.
- **FR47:** System respects the user's iOS system dark/light mode preference and updates the app theme reactively when the user toggles it at the OS level.

### NonFunctional Requirements

#### Performance

- **NFR1:** Cold start: app opens to library in ≤ 2.5 seconds on a 3-year-old iPhone over wifi.
- **NFR2:** Cached recipe detail loads in ≤ 500 ms with airplane mode on (after first online view).
- **NFR3:** Library scrolls smoothly without visible jank on a 3-year-old iPhone, verified manually during the real-device QA pass (NFR41).
- **NFR4:** Online recipe-detail fetch with cached fallback renders in ≤ 1 second over 4G.
- **NFR5:** Cook mode wake lock acquires within 500 ms of entering cook mode.
- **NFR6:** Pull-to-refresh either shows updated results or an "up to date" indicator within 2 seconds of trigger.
- **NFR7:** Inherited from web: filters and search apply instantly (client-side processing); optimistic UI updates for cook/save/favorite actions.
- **NFR8:** AI recipe extraction completes within 30 seconds for typical recipe URLs; URL-context fallback may take up to 60 seconds. A "Summarizing your recipe…" spinner is shown throughout. `maxDuration: 60` configured on the route handler.

#### Security

- **NFR9:** Authentication enforced server-side via `getCurrentUser()` on every protected endpoint; no client-trusted access decisions. (Capability defined in FR11.)
- **NFR10:** Session-token storage uses platform-encrypted credential storage with device binding (see FR14 and FR42 for capability and access-class detail).
- **NFR11:** Session token lifetime: 30 days for mobile-issued tokens (sliding window), 7 days for web cookies. Revocable via `Session` table deletion at any time.
- **NFR12:** All API traffic over HTTPS (TLS 1.2+); enforced at the Vercel edge.
- **NFR13:** No third-party analytics, telemetry, or advertising SDKs ship in the v1 binary. iOS App Privacy declaration reports zero tracking.
- **NFR14:** Partner-vault and friend-visibility access boundaries enforced server-side in `src/app/api/recipes/[id]/route.ts`; the mobile client cannot bypass these by manipulating local cache.
- **NFR15:** Defense-in-depth posture for user-generated and extracted recipe content: CSP enforcement at view layer (FR31) plus content sanitization at storage layer (FR32). Both must hold for the security boundary to be intact.

#### Reliability

- **NFR16:** Crash-free session rate ≥ 99.5% — **directional target**, not measured in v1 (no crash reporter integrated). Crash reporting deferred to v2; cross-ref NFR45 for full measurement posture.
- **NFR17:** User-initiated write actions display a success state only after server confirmation; failed writes show a clear error state with a manual retry option.
- **NFR18:** Offline-to-online network transition handled within 5 seconds (offline banner dismissal + cache refresh kickoff).
- **NFR19:** Cache persistence write failures degrade gracefully to in-memory cache (FR43); no user-visible error.
- **NFR20:** AI extraction failures fall back to manual entry (existing web behavior preserved on mobile).
- **NFR21:** Vercel backend uptime target: 99.9% for the API endpoints the mobile app depends on (inherited from web reliability NFR).

#### Resource Consumption

- **NFR22:** **Directional resource targets** (not instrumented in v1; verified opportunistically): battery ≤ 8%/hr during cook mode on iPhone 13+; offline cache ≤ 10 MB per 200 recipes; typical user-session network round-trip ≤ 30 KB compressed. These targets constrain design choices, not release gates.
- **NFR25:** **Background:** app does NOT poll the feed while backgrounded (battery preservation). Polling resumes on foreground (already gated by existing `useFeedPolling` visibility check).

#### Accessibility

- **NFR26:** All interactive controls expose meaningful VoiceOver labels (e.g., "Mark recipe cooked, opens cook-log dialog").
- **NFR27:** App respects iOS Dynamic Type — text scales with the system text-size setting up to the next Tailwind breakpoint.
- **NFR28:** All touch targets meet Apple HIG minimum: 44 × 44 points.
- **NFR29:** Text-to-background contrast meets WCAG AA: 4.5:1 for normal text, 3:1 for large text. Inherited dark mode (FR47) provides reduced eye strain in dim kitchen lighting.

#### App Store Compliance

- **NFR30:** iOS App Privacy declaration matches FR35 disclosures and stays in sync with backend data collection going forward.
- **NFR31:** Encryption export compliance: `ITSAppUsesNonExemptEncryption: NO` in Info.plist (standard HTTPS only, no novel cryptography — eligible for exemption).
- **NFR32:** Native polish (splash, icon, status bar styling, haptics, edge-to-edge) sufficient to pass Apple App Store Review Guideline 4.2 (Minimum Functionality).
- **NFR33:** All Capacitor plugins used in v1 are App Store–permitted (no private iOS API usage).
- **NFR34:** TestFlight beta build passes Apple's beta review on first or second submission.

#### Integration

- **NFR35:** The mobile app integrates only with the existing Simmer Vercel-hosted Next.js backend. No direct external API calls from the device.
- **NFR36:** Gemini AI extraction is server-side only — the mobile client cannot invoke Gemini directly.
- **NFR37:** Capacitor plugin set for v1: `@capacitor/network`, `@capacitor/preferences`, `@capacitor/haptics`, `@capacitor/status-bar`, `@capacitor/splash-screen`, `@capacitor/app`, `@capacitor-community/secure-storage`. New plugin additions require a security review.
- **NFR38:** API wire format identical to web (JSON over HTTPS), with tag arrays stored as JSON-encoded strings — existing serialization contract preserved without modification.

#### Test Surface (Explicit Mitigation for Flagged Risk)

- **NFR39:** **Dual-auth regression checklist:** all 16 existing API endpoints verified against both cookie path and `Authorization: Bearer` path (32 manual verifications) before TestFlight enablement. Checklist lives at `docs/dual-auth-regression-checklist.md`.
- **NFR40:** **Auth golden-path smoke test:** 5 endpoints × 2 paths (login, list recipes, view recipe, log cook, view feed; cookie + Bearer) executed on production immediately after the dual-auth deploy. Mobile enablement gated on 10/10 passing.
- **NFR41:** **Real-device QA pass:** the founder's iPhone serves as the v1 canary. Before TestFlight invites are issued to other family members, the founder completes a full manual QA pass covering: signup, login on cold install, library browse, recipe view (online + offline), cook mode + wake lock, cook log with rating, save-from-feed, partner invite + accept, partner unlink, logout.
- **NFR42:** **WKWebView parity note:** any behavior delta between web (Safari) and mobile (WKWebView) — cookie handling, wake lock reliability, secure storage edge cases — documented at `docs/mobile-parity-notes.md`.
- **NFR43:** **Cache-invalidation verification:** FR23 (app-resume), FR34 (access-control changes), FR37 (network transition), FR44 (stale cache → server-deleted) each verified manually on a real device before TestFlight ship.

#### Operations, Measurement & Maintenance

- **NFR44:** **App-version forward compatibility:** mobile app and backend agree on a stable wire-format contract. Backend changes additive — new fields nullable; existing field types preserved. Breaking wire-format changes require a coordinated mobile release with a backend rollback plan documented before deployment.
- **NFR45:** **Measurement posture (explicit non-goal for v1):** v1 ships WITHOUT crash reporting, analytics, or telemetry SDKs. Success-criteria metrics tracked via direct family-cohort conversation and manual founder observation. Targets in NFR16 and NFR22 are directional, not instrumented.
- **NFR46:** **Backend incident awareness:** founder subscribes to `vercel-status.com` notifications (and any managed-Postgres provider status feeds) for production incident awareness during family-cohort phase.
- **NFR47:** **iOS / Capacitor compatibility maintenance:** Capacitor SDK + plugin set reviewed for compatibility within 2 weeks of each iOS major release. Plan: skim the Capacitor changelog and run a real-device build at iOS major-version GA.

### Additional Requirements

These are technical and infrastructure requirements extracted from the mobile Architecture Decision Document. They drive implementation work that is not directly expressed as user-facing FRs but is required for the mobile binary to exist, build, and ship.

#### Starter Template / Project Bootstrap

- **AR1:** **Capacitor 7.x iOS wrap of existing Next.js codebase.** Per architecture-mobile.md and the May 2026 technical research, Capacitor was the selected mobile form factor over PWA, Expo, and fully native. This bootstrap requires a single initialization command sequence (`npm install @capacitor/core @capacitor/cli`, `npx cap init`, `npx cap add ios`, plugin installs, `npx cap sync ios`) and produces the `ios/` directory at repo root. **This is Epic 1, Story 1.**
- **AR2:** **Capacitor configuration** — `capacitor.config.ts` at repo root with `server.url` pointing to deployed Vercel domain (`https://simmer.vercel.app` production / `http://localhost:3000` development) and `allowNavigation` restricted to first-party + recipe-source domains.
- **AR3:** **TanStack Query introduction.** Install `@tanstack/react-query`, `@tanstack/query-async-storage-persister`, `@tanstack/react-query-persist-client`. This is a new dependency not present in the existing web codebase; it is required to power the offline read cache.
- **AR4:** **Capacitor plugin set installed:** `@capacitor/network`, `@capacitor/preferences`, `@capacitor/haptics`, `@capacitor/status-bar`, `@capacitor/splash-screen`, `@capacitor/app`, `@capacitor-community/secure-storage`, `@capacitor/ios`.

#### Backend & Infrastructure

- **AR5:** **Bearer-token auth modification** in `src/lib/auth.ts` — extend `getCurrentUser()` (~10 LOC) to read `Authorization: Bearer <token>` header as fallback when no cookie is present. Touches every authed API route indirectly.
- **AR6:** **Login/signup response body modification** — `src/app/api/auth/login/route.ts` and `src/app/api/auth/signup/route.ts` return `{ user, token }` in response body in addition to setting the existing cookie.
- **AR7:** **Sliding-window session expiry** — server-side `Session.expiresAt` extended by 30 days on each successful Bearer-auth request; web cookie path unchanged.
- **AR8:** **CSP `img-src` header** on `/recipes/[id]` route group — configured in `next.config.ts` headers config. Restricts outbound image loads to known CDN allowlist + recipe's source domain. (Implements FR31.)
- **AR9:** **Server-side recipe content sanitization** in `src/lib/extract.ts` — strip event handlers, inline scripts before storing extracted recipe content in Postgres. (Implements FR32.)
- **AR10:** **Vercel Pro with Fluid Compute** confirmed for `maxDuration: 60` on `/api/recipes/summarize` route handler.
- **AR11:** **No new schema migrations in v1.** Database schema treated as frozen for mobile launch. (DeviceToken table for push deferred to v2.)

#### iOS Native Asset Production

- **AR12:** **Native iOS app icon set** in `ios/App/App/Assets.xcassets/AppIcon.appiconset/` — all required iOS sizes for iPhone and iPad including 1024×1024 base.
- **AR13:** **`LaunchScreen.storyboard`** at `ios/App/App/LaunchScreen.storyboard` — brand-matched native launch storyboard rendered before WKWebView mounts. Background built using existing `background-elevated` color value.
- **AR14:** **`Info.plist` configuration** in `ios/App/App/Info.plist` — `ITSAppUsesNonExemptEncryption: NO`; iOS App Privacy declarations matching FR35 (NSPrivacyAccessedAPITypes + privacy manifest).

#### Data Architecture (Mobile Client)

- **AR15:** **TanStack Query client + persister configuration** in `src/lib/query-client.ts` — `@tanstack/query-async-storage-persister` backed by `@capacitor/preferences` (NSUserDefaults on iOS). Persisted on every cache update; rehydrated on app launch. Cache-key strategy keyed by user ID.
- **AR16:** **Query staleTime configuration** — 5 minutes for library / saved-recipes / partner-vault / feed queries; `Infinity` for recipe-detail queries (refetch only on explicit pull-to-refresh).
- **AR17:** **Cache invalidation hooks** at: logout (FR33), partner unlink / friend removal / friend-request decline (FR34), app foreground transition (FR23), network online transition (FR37), pull-to-refresh (FR38).
- **AR18:** **Persistence failure fallback** — transparent fallback to in-memory cache; no user-visible error (FR43).

#### Native Integration Layer

- **AR19:** **`src/lib/native.ts`** — single source of truth for `Capacitor.isNativePlatform()` runtime detection and Capacitor plugin import barrels. All Capacitor APIs accessed only through this module + hooks (no direct `@capacitor/*` imports in components).
- **AR20:** **`src/lib/api-client.ts`** — fetch wrapper that attaches `Authorization: Bearer <token>` header from iOS Keychain on native; handles 401 by clearing Keychain + redirecting to login.

#### Manual Verification Substitute for Missing Test Suite

- **AR21:** **`docs/dual-auth-regression-checklist.md` produced** — 16 endpoints × 2 auth paths = 32 manual verifications. Gate for TestFlight enablement. (Implements NFR39.)
- **AR22:** **`docs/mobile-parity-notes.md` produced** — documents WKWebView behavior deltas from Safari (cookie handling, wake lock reliability, secure storage edge cases). (Implements NFR42.)
- **AR23:** **`docs/mobile-polish-backlog.md` produced** — captures all v2-deferred polish items (per UX spec meta-rule).

#### Distribution & Operations

- **AR24:** **Apple Developer Program enrollment** ($99/yr) — hard prereq for long-lived TestFlight builds. Budget 1–14 day identity-verification delay. Required before public family invites; 7-day Apple-ID builds permissible for founder-only initial testing.
- **AR25:** **TestFlight distribution channel setup** — App Store Connect app record, TestFlight build pipeline (manual Xcode archive → upload), beta-tester invite list.
- **AR26:** **Vercel + Postgres status-feed subscription** — founder subscribed to `vercel-status.com` and managed-Postgres provider status feeds. (Implements NFR46.)

### UX Design Requirements

Extracted from the mobile UX Design Specification. These are not duplicated from FRs (which they implement); they are the UX-design-derived implementation requirements that translate principles into shippable artifacts.

#### Custom Mobile Components & Hooks (Integration Layer)

- **UX-DR1:** **`OfflineBanner` component** (`src/components/offline-banner.tsx`) — persistent "You're offline — showing cached recipes" banner; muted-foreground text on `background-elevated`; sits below safe-area top inset; non-dismissible during offline; auto-dismisses on network return; VoiceOver label "You are offline. The app is showing cached recipes."; `role="status"`. Implements FR21, FR37, FR39.
- **UX-DR2:** **`CacheTimestamp` component** (`src/components/cache-timestamp.tsx`) — "Updated *N* min ago" label on recipe detail views; `text-xs foreground-muted`; reads `dataUpdatedAt` from TanStack Query cache; re-renders on cache update; states: just-fetched / 1+ min / 5+ min / 1+ hr / > 24 hr; `role="status"`. Implements FR22.
- **UX-DR3:** **`useHapticFeedback()` hook** (`src/hooks/use-haptic-feedback.ts`) — returns three named functions: `confirmCookLog()`, `confirmSaveFromFeed()`, `confirmPartnerUnlink()`. Each maps to a specific Capacitor haptic intensity (medium-impact). No-ops on web. Implements FR28, FR29, FR30.
- **UX-DR4:** **`useStatusBarMode()` hook** (`src/hooks/use-status-bar-mode.ts`) — `setMode('default' | 'cook-mode')`. Cook mode dims the bar; default restores. Wraps `@capacitor/status-bar`. Called from `RecipeDetail` cook-mode toggle. Implements FR27.
- **UX-DR5:** **`useAppResume()` hook** (`src/hooks/use-app-resume.ts`) — listens for `@capacitor/app` `appStateChange` events; triggers `queryClient.invalidateQueries` on foreground transition; mounted once at root layout. Implements FR23.
- **UX-DR6:** **`useNetworkState()` hook** (`src/hooks/use-network-state.ts`) — returns `{ isOnline: boolean }`; wraps `@capacitor/network`; falls back to `navigator.onLine` on web; powers `OfflineBanner` and write-action gating. Implements FR20, FR24.
- **UX-DR7:** **`SafeAreaLayout` wrapper** (`src/components/safe-area-layout.tsx`) — applies iOS safe-area insets to root layout using `env(safe-area-inset-*)` CSS variables; pure CSS, no JS runtime cost. Implements FR46.

#### Visual & Interaction Polish

- **UX-DR8:** **Cook-mode large typography rendering** in `recipe-detail.tsx` — switch step display to `text-2xl` / `text-3xl` (existing Tailwind scale) when cook mode is active; readable from arm's length.
- **UX-DR9:** **Inherited Tailwind v4 design system, no new tokens.** All mobile UI uses existing tokens (`accent-amber`, `foreground`, `foreground-muted`, `background`, `background-elevated`, existing border/destructive semantic tokens). No new design tokens introduced in v1.
- **UX-DR10:** **Typography stack preserved** — Playfair Display (display/headings), Geist Sans (body/UI), Geist Mono (durations/ratings/data). No SF Pro substitution in v1.
- **UX-DR11:** **iOS Dynamic Type support** — text scales with iOS system text-size setting up to next Tailwind breakpoint, no truncation/overflow at largest accessibility text size. Implements NFR27.
- **UX-DR12:** **Touch target sizing** — all interactive elements ≥ 44 × 44 pt; visual size may be smaller with tap zone extended via padding. Implements NFR28.
- **UX-DR13:** **Color contrast verification** — accent-amber on `background-elevated` meets 4.5:1 in both light and dark mode; verified manually pre-TestFlight. Implements NFR29.

#### UX Pattern Standards

- **UX-DR14:** **Button hierarchy enforcement** — Primary (solid accent-amber, white text); Secondary (outline + foreground text); Tertiary/Text (no fill/border + muted text); Destructive (red semantic token). Primary haptic only on 3 outcome moments (FR28–FR30); other primary buttons silent.
- **UX-DR15:** **Feedback pattern enforcement** — Success-outcome = optimistic UI + haptic + inline confirm; Success-routine = optimistic UI only; Error-recoverable-field = inline error under field; Error-unrecoverable-screen = banner at top with next-action; Warning = inline amber text; Info/persistent state = banner (not toast); Loading <300ms = nothing; 300ms-2s = inline spinner; 2s+ = progress text + spinner. **No toasts in v1** (VoiceOver can't read them).
- **UX-DR16:** **Form patterns** — single-column layout; labels above fields; "Required" text label (no asterisks alone); inline validation errors below field in destructive color; iOS `inputmode` per field type (`email`, `numeric`, `search`); field scrolls into view on focus; Return-key advances or submits; Done-key dismisses; sticky submit above keyboard with inline spinner during request.
- **UX-DR17:** **Navigation pattern set** — bottom-tab nav persistent (except cook mode); iOS edge-swipe back gesture (FR40); pull-to-refresh on Library/Feed/recipe detail (FR38); modal sheet slide-up-swipe-down for destructive confirmations; in-place expansion preferred over modals; tab badge for friend-request count.
- **UX-DR18:** **Empty state copy** — Library empty: "Your library is empty. Paste a recipe URL or save one from the feed to get started." + "Add a recipe" primary CTA. Feed empty: "No activity yet. When friends cook or save recipes, you'll see it here." + "Find friends" secondary CTA. Want to try empty: "Recipes you save will appear here." Friend search no results: "No one found. Friends need to sign up first." Cook history empty: inherited from web.
- **UX-DR19:** **Cook-mode interruption recovery** — wake lock releases gracefully on phone call / battery warning / app backgrounding; recipe stays cached; cook mode re-entry is one tap from recipe detail; step scroll position preserved.

#### Accessibility & Inclusion

- **UX-DR20:** **VoiceOver coverage for 5 common tasks** — library browse, recipe view (online + offline), log cook with rating, save from feed, unlink partner — all complete via VoiceOver alone. Verified in pre-TestFlight QA checklist (NFR41). Implements P8, NFR26.
- **UX-DR21:** **Color independence** — no information conveyed by color alone; error states pair text + icon; offline state pairs banner + disabled controls. Haptic feedback always paired with visual feedback, never haptic-alone.
- **UX-DR22:** **Reduced motion support** — honor `prefers-reduced-motion`; disable subtle animations / transitions for motion-sensitive users.
- **UX-DR23:** **Dark mode parity** — reactive to iOS system dark/light mode (FR47); all surfaces render correctly with web's existing Tailwind dark-mode variants verified during real-device QA.
- **UX-DR24:** **No status-code errors anywhere** (P9) — every error string names the user's next action ("Try again", "Connect to sign in", "Connect to save"), never "Error 401" or "Network error 500".

#### Documentation Artifacts

- **UX-DR25:** **`docs/mobile-polish-backlog.md` populated continuously** — every divergence pressure surfaced during real-device QA is captured here for v2 consideration; not addressed in v1.

### FR Coverage Map

Every FR, NFR, AR, and UX-DR is mapped to a single primary epic. Cross-cutting items list their primary owning epic; secondary touchpoints are noted where relevant.

#### Functional Requirements → Epic

| FR | Title (paraphrase) | Epic |
|---|---|---|
| FR1 | Inherited recipe management | Epic 2 (touch-only inherited-flow validation) |
| FR2 | Inherited go-to signals | Epic 2 |
| FR3 | Inherited AI recipe extraction | Epic 2 |
| FR4 | Inherited partner vault | Epic 2 |
| FR5 | Inherited friend connections | Epic 2 |
| FR6 | Inherited activity feed | Epic 2 |
| FR7 | Inherited account & auth | Epic 2 |
| FR8 | Install via TestFlight invite | Epic 7 |
| FR9 | Native launch screen | Epic 2 |
| FR10 | Native app icon | Epic 2 |
| FR11 | Dual-auth (Bearer + cookie) | Epic 1 |
| FR12 | Login/signup return token in body | Epic 1 |
| FR13 | Mobile email/password sign-in | Epic 3 |
| FR14 | iOS Keychain persistence | Epic 3 |
| FR15 | Attach `Authorization: Bearer` header | Epic 3 |
| FR16 | 30-day sliding-window expiry (server-issued) | Epic 1 |
| FR17 | Sign-out clears Keychain + cache | Epic 3 |
| FR18 | Redirect to login on rejected token | Epic 3 |
| FR19 | Cache library/partner/saved/feed | Epic 4 |
| FR20 | Cache recipe detail | Epic 4 |
| FR21 | Persistent offline banner | Epic 4 |
| FR22 | "Updated N min ago" timestamp | Epic 4 |
| FR23 | App-resume cache invalidation | Epic 4 |
| FR24 | Disable writes offline with inline reason | Epic 4 |
| FR25 | Enter / exit cook mode | Epic 5 |
| FR26 | Screen wake lock during cook mode | Epic 5 |
| FR27 | Status-bar styling in cook mode | Epic 5 |
| FR28 | Haptic on cook log | Epic 6 |
| FR29 | Haptic on save-from-feed | Epic 6 |
| FR30 | Haptic on partner unlink | Epic 6 |
| FR31 | CSP `img-src` on recipe pages | Epic 1 |
| FR32 | Server-side content sanitization | Epic 1 |
| FR33 | `queryClient.clear()` on logout | Epic 4 |
| FR34 | Cache invalidation on access-control changes | Epic 4 |
| FR35 | iOS App Privacy declaration | Epic 2 |
| FR36 | First-launch flow logic | Epic 3 |
| FR37 | Auto-refresh on offline→online | Epic 4 |
| FR38 | Pull-to-refresh on lists | Epic 4 |
| FR39 | Non-dismissible offline banner | Epic 4 |
| FR40 | iOS swipe-back gesture | Epic 2 |
| FR41 | Touch-only operability of inherited flows | Epic 2 |
| FR42 | Keychain `AfterFirstUnlockThisDeviceOnly` access class | Epic 3 |
| FR43 | Cache write failure → in-memory fallback | Epic 4 |
| FR44 | Stale-deleted recipe handling | Epic 4 |
| FR45 | CSP image fallback chain | Epic 4 |
| FR46 | iOS safe-area insets | Epic 2 |
| FR47 | iOS dark/light mode reactivity | Epic 2 |

#### Non-Functional Requirements → Epic

| NFR | Title (paraphrase) | Epic |
|---|---|---|
| NFR1 | Cold start ≤ 2.5 s | Epic 4 |
| NFR2 | Cached recipe ≤ 500 ms offline | Epic 4 |
| NFR3 | Smooth scroll on 3-yr-old iPhone | Epic 2 |
| NFR4 | Online recipe-detail ≤ 1 s on 4G | Epic 4 |
| NFR5 | Wake lock acquire ≤ 500 ms | Epic 5 |
| NFR6 | Pull-to-refresh resolves ≤ 2 s | Epic 4 |
| NFR7 | Inherited filters/search instant; optimistic UI | Epic 4 |
| NFR8 | AI extraction ≤ 30 s typical / 60 s fallback | Epic 1 |
| NFR9 | Server-side auth enforcement | Epic 1 |
| NFR10 | Keychain platform-encrypted storage | Epic 3 |
| NFR11 | 30-day mobile / 7-day web token expiry | Epic 1 |
| NFR12 | HTTPS TLS 1.2+ | Epic 1 |
| NFR13 | No 3rd-party analytics SDKs in v1 binary | Epic 2 |
| NFR14 | Server-side access boundaries | Epic 1 |
| NFR15 | Defense-in-depth (CSP + sanitization) | Epic 1 |
| NFR16 | Crash-free ≥ 99.5% (directional) | Epic 7 |
| NFR17 | Write success after server confirm | Epic 4 |
| NFR18 | Offline→online handled ≤ 5 s | Epic 4 |
| NFR19 | Cache persistence failure fallback | Epic 4 |
| NFR20 | AI extraction failure falls to manual entry | Epic 2 (inherited behavior validation) |
| NFR21 | Vercel backend 99.9% uptime SLA | Epic 1 |
| NFR22 | Directional battery / cache / network targets | Epic 7 |
| NFR25 | No background polling | Epic 4 |
| NFR26 | VoiceOver labels on every interactive element | Epic 2 |
| NFR27 | iOS Dynamic Type | Epic 2 |
| NFR28 | 44 × 44 pt touch targets | Epic 2 |
| NFR29 | WCAG AA contrast | Epic 2 |
| NFR30 | App Privacy declarations in sync | Epic 2 |
| NFR31 | `ITSAppUsesNonExemptEncryption: NO` | Epic 2 |
| NFR32 | Native polish for App Store Review 4.2 | Epic 2 |
| NFR33 | App Store–permitted plugins only | Epic 2 |
| NFR34 | TestFlight beta approval first/second submission | Epic 7 |
| NFR35 | Mobile only integrates with Simmer backend | Epic 1 |
| NFR36 | Gemini API server-side only | Epic 1 |
| NFR37 | Documented Capacitor plugin set | Epic 2 |
| NFR38 | Wire format identical to web | Epic 1 |
| NFR39 | Dual-auth regression checklist (16 × 2) | Epic 1 |
| NFR40 | Auth golden-path smoke test on production | Epic 1 |
| NFR41 | Real-device QA pass on founder iPhone | Epic 7 |
| NFR42 | WKWebView parity notes documented | Epic 7 |
| NFR43 | Cache-invalidation manual verification | Epic 7 |
| NFR44 | App-version forward-compat wire format | Epic 1 |
| NFR45 | No crash/analytics/telemetry SDKs (non-goal) | Epic 7 |
| NFR46 | Vercel/Postgres status feed subscription | Epic 7 |
| NFR47 | iOS / Capacitor compat maintenance cadence | Epic 7 |

#### Additional Requirements → Epic

| AR | Title (paraphrase) | Epic |
|---|---|---|
| AR1 | Capacitor 7.x iOS wrap (Epic 2, Story 1) | Epic 2 |
| AR2 | `capacitor.config.ts` with `server.url` + allowNavigation | Epic 2 |
| AR3 | TanStack Query + persister install | Epic 4 |
| AR4 | Capacitor plugin set installed | Epic 2 |
| AR5 | `getCurrentUser` accepts Bearer header (~10 LOC) | Epic 1 |
| AR6 | Login/signup return `{ user, token }` in body | Epic 1 |
| AR7 | Server-side 30-day sliding-window expiry | Epic 1 |
| AR8 | CSP `img-src` header on `/recipes/[id]` | Epic 1 |
| AR9 | Server-side recipe content sanitization | Epic 1 |
| AR10 | Vercel Pro + Fluid Compute confirmed | Epic 1 |
| AR11 | No schema migrations in v1 | Epic 1 |
| AR12 | iOS app icon set (all sizes) | Epic 2 |
| AR13 | `LaunchScreen.storyboard` | Epic 2 |
| AR14 | `Info.plist` (encryption + App Privacy) | Epic 2 |
| AR15 | TanStack Query client + persister config | Epic 4 |
| AR16 | Query `staleTime` configuration | Epic 4 |
| AR17 | Cache invalidation hooks (logout/unlink/etc) | Epic 4 |
| AR18 | Persistence-failure in-memory fallback | Epic 4 |
| AR19 | `src/lib/native.ts` runtime-check helper | Epic 2 |
| AR20 | `src/lib/api-client.ts` (Bearer + 401 interceptor) | Epic 3 |
| AR21 | `docs/dual-auth-regression-checklist.md` produced | Epic 1 |
| AR22 | `docs/mobile-parity-notes.md` produced | Epic 7 |
| AR23 | `docs/mobile-polish-backlog.md` produced | Epic 2 |
| AR24 | Apple Developer Program enrollment | Epic 7 — **✅ COMPLETE** (already enrolled by founder; no longer a story) |
| AR25 | TestFlight distribution channel setup | Epic 7 |
| AR26 | Vercel + Postgres status feed subscription | Epic 7 |

#### UX Design Requirements → Epic

| UX-DR | Title (paraphrase) | Epic |
|---|---|---|
| UX-DR1 | `OfflineBanner` component | Epic 4 |
| UX-DR2 | `CacheTimestamp` component | Epic 4 |
| UX-DR3 | `useHapticFeedback()` hook | Epic 6 |
| UX-DR4 | `useStatusBarMode()` hook | Epic 5 |
| UX-DR5 | `useAppResume()` hook | Epic 4 |
| UX-DR6 | `useNetworkState()` hook | Epic 4 |
| UX-DR7 | `SafeAreaLayout` wrapper | Epic 2 |
| UX-DR8 | Cook-mode large typography | Epic 5 |
| UX-DR9 | Inherited Tailwind design system | Epic 2 |
| UX-DR10 | Inherited typography stack | Epic 2 |
| UX-DR11 | iOS Dynamic Type support | Epic 2 |
| UX-DR12 | 44pt touch target sizing | Epic 2 |
| UX-DR13 | Color contrast verification | Epic 2 |
| UX-DR14 | Button hierarchy enforcement | Epic 2 |
| UX-DR15 | Feedback pattern enforcement | Epic 4 |
| UX-DR16 | Form patterns (login screen) | Epic 3 |
| UX-DR17 | Navigation pattern set | Epic 4 |
| UX-DR18 | Empty state copy | Epic 4 |
| UX-DR19 | Cook-mode interruption recovery | Epic 5 |
| UX-DR20 | VoiceOver coverage for 5 common tasks | Epic 2 |
| UX-DR21 | Color independence (no info-by-color-alone) | Epic 2 |
| UX-DR22 | Reduced-motion support | Epic 2 |
| UX-DR23 | Dark mode parity | Epic 2 |
| UX-DR24 | No status-code errors (P9) | Epic 3 |
| UX-DR25 | `docs/mobile-polish-backlog.md` populated continuously | Epic 7 |

**Coverage status:** 47 FRs / 47 NFRs / 26 ARs / 25 UX-DRs all mapped. ✅

## Epic List

### Epic 1: Mobile-Ready Backend Foundation

**Goal:** Ship the dual-path authentication (cookie + Bearer), CSP header on recipe pages, server-side recipe content sanitization, and the dual-auth regression checklist + golden-path smoke test to production. The existing Simmer web app continues to function exactly as before; the API surface is now ready to authenticate mobile clients. This epic de-risks the cross-cutting auth change in isolation per the architecture document's cross-component dependency.

**User outcome:** Existing web users see zero regression; the API is mobile-ready.

**FRs covered:** FR11, FR12, FR16, FR31, FR32
**NFRs covered:** NFR8, NFR9, NFR11, NFR12, NFR14, NFR15, NFR21, NFR35, NFR36, NFR38, NFR39, NFR40, NFR44
**ARs covered:** AR5, AR6, AR7, AR8, AR9, AR10, AR11, AR21

---

### Epic 2: iOS App Bootstrap & Native Shell

**Goal:** Capacitor-wrap the deployed Next.js app into an installable iOS binary with native chrome — splash, icon, safe-area-aware layout, swipe-back, dark/light mode, Info.plist privacy declarations. Establish the Capacitor isolation pattern (`src/lib/native.ts` + hooks), produce the mobile-polish-backlog doc, and bake App Store Review Guideline 4.2 polish into the foundation. All inherited web flows are validated for touch-only operability, VoiceOver coverage, and accessibility from the moment the binary builds.

**User outcome:** The founder taps the Simmer icon on their iPhone home screen and the app opens to a native-feeling shell — proper splash, safe areas, iOS gestures, dark/light reactive, all inherited web features operable via touch and VoiceOver.

**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR9, FR10, FR35, FR40, FR41, FR46, FR47
**NFRs covered:** NFR3, NFR13, NFR20, NFR26, NFR27, NFR28, NFR29, NFR30, NFR31, NFR32, NFR33, NFR37
**ARs covered:** AR1 (**Story 1**), AR2, AR4, AR12, AR13, AR14, AR19, AR23
**UX-DRs covered:** UX-DR7, UX-DR9, UX-DR10, UX-DR11, UX-DR12, UX-DR13, UX-DR14, UX-DR20, UX-DR21, UX-DR22, UX-DR23

---

### Epic 3: Mobile Sign-In & Session Persistence

**Goal:** Connect the mobile binary to the backend via the Bearer-token path. Persist the token in iOS Keychain with the `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly` access class. Wire the first-launch flow logic (Keychain → login → onboarding modal → library), sliding-window refresh on each API call, and clean sign-out that clears Keychain. Login/signup form copy follows the inline-error / no-status-code conventions.

**User outcome:** A family member taps the icon, signs in once on first install, and never sees the login screen again until they sign out — the session survives app restarts and device reboots.

**FRs covered:** FR13, FR14, FR15, FR17, FR18, FR36, FR42
**NFRs covered:** NFR10
**ARs covered:** AR20
**UX-DRs covered:** UX-DR16, UX-DR24

**⚠️ Open product decision required before Step 3 story creation (per pre-mortem #7):** The FR36 first-launch flow routes on `User.hasSeenOnboarding`, which is shared with web. Define expected behavior for: (a) brand-new mobile signup → onboarding modal, (b) web-onboarded user installing mobile for the first time → ??, (c) mobile-onboarded user reopening app → no modal. Path (b) needs an explicit product decision (show mobile-specific onboarding? skip? show a different first-mobile-launch message?).

---

### Epic 4: Offline-First Reading & Cache Lifecycle

**Goal:** Introduce TanStack Query as the data primitive for client components, persisted via `@tanstack/query-async-storage-persister` backed by `@capacitor/preferences` (NSUserDefaults on iOS). Build the OfflineBanner, CacheTimestamp, useNetworkState, and useAppResume primitives. Implement pull-to-refresh on Library / Feed / recipe detail, and wire the complete cache-invalidation surface (logout, partner unlink, friend removal, friend-request decline, stale-deleted recipes, app-resume, network-restore). Disabled-write states are designed with inline "Connect to save" copy per P2.

**User outcome:** Linda opens the app at the stove on weak wifi; her saved recipes load instantly with a calm "showing cached recipes" banner. She knows exactly which data is cached and how fresh it is. When her partner unlinks the vault, that partner's recipes disappear from her cache.

**FRs covered:** FR19, FR20, FR21, FR22, FR23, FR24, FR33, FR34, FR37, FR38, FR39, FR43, FR44, FR45
**NFRs covered:** NFR1, NFR2, NFR4, NFR6, NFR7, NFR17, NFR18, NFR19, NFR25
**ARs covered:** AR3, AR15, AR16, AR17, AR18
**UX-DRs covered:** UX-DR1, UX-DR2, UX-DR5, UX-DR6, UX-DR15, UX-DR17, UX-DR18

**📋 Story-creation guidance for this fat epic (per pre-mortem #2 + #3):**
- **Foundation-first story ordering:** The first story must land TanStack Query provider + persister + client wiring as pure infrastructure, before any per-screen migration. Per-screen migration stories follow incrementally. Cache-invalidation stories land last so they're built on a stable base.
- **FR34 (access-control cache invalidation) must be its own dedicated story** with privacy-grade acceptance criteria: (a) partner unlink fires `invalidateQueries` on partner-vault and partner-recipe keys; (b) reopening the app offline does NOT surface previously-cached partner recipes after unlink; (c) friend removal and friend-request decline behave identically for their respective cached content. Do NOT bundle FR34 into a generic "cache invalidation" story.

---

### Epic 5: Cook Mode at the Stove

**Goal:** The flagship mobile moment. Cook mode toggle holds the iPhone's screen awake via the Screen Wake Lock API, dims the status bar via `@capacitor/status-bar`, and switches the step display to large-font typography readable from arm's length. Interruption recovery (phone call, battery warning, app backgrounding) releases the wake lock gracefully; the recipe stays cached; cook mode re-entry is one tap from the recipe detail with step scroll position preserved.

**User outcome:** Jamie cooks Thai basil chicken for 30 minutes. The screen stays alive, the steps are readable from arm's length, the status bar fades into the cook-mode theme, the app gets out of the way for the entire cook, and a phone call interruption recovers cleanly.

**FRs covered:** FR25, FR26, FR27
**NFRs covered:** NFR5
**UX-DRs covered:** UX-DR4, UX-DR8, UX-DR19

**📋 Story-creation guidance (per pre-mortem #4):** Cook mode introduces new interactive surface (large-typography step display, status-bar dim toggle, cook-mode exit affordance) not covered by Epic 2's inherited-flow VoiceOver verification. Every Epic 5 story must include an explicit VoiceOver-coverage acceptance criterion per UX-DR20 / P8 — the cook-mode toggle, step navigation, and exit affordance all announce meaningfully.

---

### Epic 6: Native Outcome Feedback (Haptics)

**Goal:** The three haptic moments that confirm outcomes the web cannot deliver. `useHapticFeedback()` hook exposes `confirmCookLog()`, `confirmSaveFromFeed()`, `confirmPartnerUnlink()` — each maps to a specific Capacitor medium-impact haptic and is invoked from the corresponding component (`RecipeDetail`, `FeedItem`, `PartnerSection`). Haptics fire on user-action intent (P6) — paired with visual feedback (P8 / UX-DR21), never haptic-alone.

**User outcome:** When Sarah saves a recipe from the feed, her phone vibrates a precise medium-impact confirmation. When Jamie marks a cook complete, same. When Alex unlinks a partner connection, same. The app fits in your hand and your life without performing for you.

**FRs covered:** FR28, FR29, FR30
**UX-DRs covered:** UX-DR3

**📋 Story-creation guidance (per pre-mortem #4 + #8):**
- **VoiceOver pairing:** Every Epic 6 story must include an acceptance criterion that the haptic is paired with a visible/announced confirmation — never haptic-alone (UX-DR21). VoiceOver users who don't feel the haptic still get explicit confirmation.
- **Multi-device haptic perception:** Capacitor `ImpactStyle.Medium` renders differently across Taptic Engine generations. Each FR28/29/30 story must include an AC: "verified on at least 2 iPhone generations from the family cohort (e.g., iPhone 11/12/13/14/15)" — OR explicitly accept the variance risk with a mobile-polish-backlog entry to revisit if family feedback flags it.

---

### Epic 7: Real-Device Validation & TestFlight Launch

**Goal:** The manual verification gates that substitute for the missing automated test net — real-device QA pass on the founder's iPhone covering signup, login, library browse, recipe view (online + offline), cook mode + wake lock, cook log + rating, save-from-feed, partner invite + accept, partner unlink, and logout. Document WKWebView behavior deltas in mobile-parity-notes. TestFlight distribution channel setup. Vercel + Postgres status feed subscription. Continuous polish-backlog capture during QA. iOS-major-release compatibility maintenance cadence established.

**User outcome:** Family members receive a TestFlight invite link, install Simmer Mobile within 7 days, and start using it weekly. Apple's beta review approves the build on the first or second submission. The founder has operational awareness for backend incidents.

**FRs covered:** FR8
**NFRs covered:** NFR16, NFR22, NFR34, NFR41, NFR42, NFR43, NFR45, NFR46, NFR47
**ARs covered:** AR22, AR25, AR26 (AR24 ✅ already complete — Apple Developer Program enrolled)
**UX-DRs covered:** UX-DR25

**📋 Story-creation guidance (per pre-mortem #1 + #5):**
- **App Store readiness audit story (early in epic, gates submission):** A single dedicated story that cross-references the integrated native-polish surface — Epic 2 (splash, icon, safe areas, swipe-back, dark mode, status bar default, App Privacy declarations), Epic 5 (cook-mode status bar styling, large typography, interruption recovery), Epic 6 (3 haptic moments). Apple TestFlight submission is blocked until every checkbox passes. This is the explicit mitigation for App Store Review Guideline 4.2 rejection risk.
- **Family device-compatibility audit story (early in epic, gates invite list):** Survey every prospective family-cohort iPhone's iOS version. Output is a confirmed roster of iOS 16+ devices. If anyone is below the floor, decision is made before invites go out: upgrade them, defer, or accept reduced rollout. Don't discover this at invite-send time.
- **VoiceOver QA must be per-epic, not single check:** The real-device QA pass should include a row for inherited-flow VoiceOver (Epic 2), cook-mode VoiceOver (Epic 5), haptic-paired visual confirmation accessible to VoiceOver (Epic 6), and offline-banner / cache-timestamp announcements (Epic 4).

---

## Epic Dependency Summary

```
Epic 1 (Backend Foundation)
    ↓ Bearer auth in production
Epic 2 (iOS Bootstrap & Native Shell)
    ↓ installable binary with native chrome
Epic 3 (Sign-In & Session Persistence)
    ↓ users can authenticate and stay signed in
Epic 4 (Offline-First Reading & Cache Lifecycle)
    ↓ data flows through TanStack Query; offline UX in place
Epic 5 (Cook Mode at the Stove)
    ↓ flagship kitchen-context experience
Epic 6 (Native Outcome Feedback)
    ↓ haptic layer on cook-log / save / unlink
Epic 7 (Real-Device Validation & TestFlight Launch)
    → family invites; launch readiness
```

Each epic is standalone within its domain — it does not require any future epic to function. Sequencing follows the architecture's cross-component dependencies.

---

## Pre-Mortem Refinements (Applied)

The 7-epic structure passed a pre-mortem critique pass (Step 2 Advanced Elicitation). The following refinements were applied to the epic descriptions above to surface failure modes before story creation; each is referenced by its `📋` annotation on the relevant epic.

| # | Refinement | Applied to |
|---|---|---|
| 1 | App Store readiness audit story (integrated native-polish gate across Epic 2 + 5 + 6) before TestFlight submission | Epic 7 guidance |
| 2 | FR34 (access-control cache invalidation) elevated to its own privacy-grade story; foundation-first story ordering for fat Epic 4 | Epic 4 guidance |
| 3 | (Folded into #2 — Epic 4 story ordering) | Epic 4 guidance |
| 4 | VoiceOver acceptance criteria explicitly required on every Epic 5 and Epic 6 story; Epic 7 QA pass row-per-epic | Epic 5 guidance + Epic 6 guidance + Epic 7 guidance |
| 5 | Family device-compatibility audit story (early in Epic 7, gates invite list) | Epic 7 guidance |
| 6 | Apple Developer enrollment: ✅ **already complete** — no story needed | AR24 row updated; Epic 7 description and tags adjusted |
| 7 | FR36 cross-platform onboarding behavior flagged as open product decision before Step 3 | Epic 3 guidance |
| 8 | Multi-device haptic perception verification on FR28/29/30 stories | Epic 6 guidance |

---

## Epic 1: Mobile-Ready Backend Foundation

Ship the dual-path authentication (cookie + Bearer), CSP header on recipe pages, server-side recipe content sanitization, and the dual-auth regression checklist + golden-path smoke test to production. Existing Simmer web users see zero regression; the API surface is mobile-ready.

### Story 1.1: Accept `Authorization: Bearer` header in `getCurrentUser()`

As a developer integrating a future mobile client,
I want the `getCurrentUser()` server helper to authenticate users via either the existing `auth-token` cookie or an `Authorization: Bearer <token>` header,
So that mobile clients can authenticate using header-based auth without breaking the web's cookie path.

**Acceptance Criteria:**

**Given** an incoming API request with the existing `auth-token` cookie set and no `Authorization` header
**When** the request handler calls `getCurrentUser()`
**Then** the helper returns the authenticated `User` resolved from the cookie's token
**And** behavior is identical to pre-change (zero web regression).

**Given** an incoming API request with no `auth-token` cookie and an `Authorization: Bearer <token>` header where `<token>` matches an unexpired row in the `Session` table
**When** the request handler calls `getCurrentUser()`
**Then** the helper returns the authenticated `User` resolved from the Bearer token.

**Given** an incoming API request with both an `auth-token` cookie and an `Authorization: Bearer` header
**When** the request handler calls `getCurrentUser()`
**Then** the helper uses the cookie token (web-primary path) and ignores the Bearer header.

**Given** an incoming API request with no cookie and no `Authorization` header
**When** the request handler calls `getCurrentUser()`
**Then** the helper returns `null` (unauthenticated).

**Given** an incoming API request with an `Authorization: Bearer <token>` header where `<token>` is not in the `Session` table or has expired
**When** the request handler calls `getCurrentUser()`
**Then** the helper returns `null` (unauthenticated)
**And** no Prisma schema changes are introduced (per AR11).

### Story 1.2: Return `Session.token` in login & signup response bodies

As a future mobile client,
I want the `/api/auth/login` and `/api/auth/signup` endpoints to return the newly issued `Session.token` in their JSON response bodies,
So that I can read it client-side and persist it in iOS Keychain.

**Acceptance Criteria:**

**Given** valid signup credentials POSTed to `/api/auth/signup`
**When** the endpoint creates a new `User` + `Session`
**Then** the response body includes `{ user, token }` where `token` is the newly created `Session.token` UUID
**And** the existing `auth-token` and `auth-status` cookies are still set in the response.

**Given** valid login credentials POSTed to `/api/auth/login`
**When** the endpoint creates a new `Session`
**Then** the response body includes `{ user, token }`
**And** the existing cookies are still set.

**Given** invalid credentials POSTed to `/api/auth/login`
**When** the endpoint rejects the credentials
**Then** the response shape and status code are unchanged from pre-modification behavior (no `token` field).

### Story 1.3: Sliding-window 30-day expiry on Bearer-auth requests

As a mobile user,
I want my session extended automatically while I'm actively using the app,
So that I don't have to re-sign-in unexpectedly during active use.

**Acceptance Criteria:**

**Given** an authenticated API request via the `Authorization: Bearer` path with a valid unexpired session
**When** the request is successfully authenticated
**Then** the matching `Session.expiresAt` is updated to `now() + 30 days` server-side
**And** the response is returned without observable delay.

**Given** an authenticated API request via the cookie path
**When** the request is successfully authenticated
**Then** `Session.expiresAt` is NOT updated by the Bearer-path sliding-window logic (web cookie 7-day expiry behavior unchanged).

**Given** an API request with an expired Bearer token
**When** `getCurrentUser()` evaluates the token
**Then** the helper returns `null` and does NOT auto-extend the already-expired session.

### Story 1.4: Sanitize extracted recipe content before storage

As a Simmer user,
I want AI-extracted recipe content to have event handlers and inline scripts stripped before storage,
So that malicious source pages can't inject content that exfiltrates my session token.

**Acceptance Criteria:**

**Given** a recipe URL submitted to `/api/recipes/summarize` returning content with `<img onerror="...">`, `<script>` tags, or inline event handlers
**When** the extraction pipeline processes the response in `src/lib/extract.ts`
**Then** all event-handler attributes are stripped
**And** all `<script>` tags are stripped
**And** the sanitized content is what gets stored in the `Recipe` table.

**Given** a recipe URL returning clean structured JSON-LD content
**When** the extraction pipeline processes it
**Then** the sanitization step is a no-op and the recipe is stored unchanged.

**Given** sanitization is applied
**When** the recipe detail page renders the content
**Then** no script execution occurs from sanitized content (verified manually via a known-malicious test fixture).

### Story 1.5: Add CSP `img-src` allowlist header on `/recipes/[id]` routes

As a Simmer user,
I want recipe detail pages to enforce a strict image-source policy via CSP,
So that even if malicious content bypasses sanitization, it cannot exfiltrate my token via an `<img>` URL.

**Acceptance Criteria:**

**Given** any request to `/recipes/[id]`
**When** the response is returned by Next.js
**Then** the response includes a `Content-Security-Policy` header with `img-src` directive
**And** the allowlist includes `'self'`, the recipe's stored source domain, and known Simmer CDN domains.

**Given** a recipe detail page renders with an `<img>` to an off-allowlist domain
**When** the browser processes the page
**Then** the image fails to load
**And** the deterministic image fallback chain from `src/lib/recipe-images.ts` renders in its place (FR45).

**Given** a recipe detail page renders with an `<img>` to an allowlisted domain
**When** the browser processes the page
**Then** the image loads normally
**And** CSP header configuration lives in `next.config.ts`.

### Story 1.6: Verify Vercel Pro + Fluid Compute + `maxDuration: 60` config

As a mobile user pasting a recipe URL,
I want the extraction endpoint to have sufficient server-side execution time for slow sources,
So that Cloudflare-protected or URL-context-fallback extractions don't time out.

**Acceptance Criteria:**

**Given** the Vercel project for Simmer's production deployment
**When** the project's plan and feature flags are inspected
**Then** the project is on Vercel Pro
**And** Fluid Compute is enabled
**And** `/api/recipes/summarize` route handler exports `maxDuration: 60`.

**Given** a recipe URL that triggers the URL-context fallback path
**When** extraction takes between 30 and 60 seconds
**Then** the route handler does not time out and the request completes successfully
**And** the configuration state is documented in `docs/development-guide.md`.

### Story 1.7: Produce `docs/dual-auth-regression-checklist.md`

As a solo developer about to enable the mobile binary against production,
I want a documented manual checklist covering every authed API endpoint × both auth paths,
So that the dual-auth deploy doesn't silently break any endpoint.

**Acceptance Criteria:**

**Given** the existing Simmer codebase
**When** all authed routes under `src/app/api/**/route.ts` are catalogued
**Then** `docs/dual-auth-regression-checklist.md` lists every authed endpoint (target ≈ 16).

**Given** the checklist document
**When** opened by a developer
**Then** each endpoint row specifies: HTTP method, URL pattern, request shape, expected response shape, cookie-path checkbox, Bearer-path checkbox.

**Given** the checklist is complete
**When** committed to the repo
**Then** it includes a header explaining it is the explicit mitigation for the "no integration test net" risk (NFR39)
**And** is referenced from `architecture-mobile.md`.

### Story 1.8: Execute dual-auth regression checklist

As a solo developer enabling the mobile binary against production,
I want to manually verify every authed endpoint works via both auth paths,
So that I have explicit confidence the dual-auth change is regression-free.

**Acceptance Criteria:**

**Given** the dual-auth backend changes (Stories 1.1–1.3) are deployed to a verifiable environment
**When** the developer executes every row in `docs/dual-auth-regression-checklist.md`
**Then** every cookie-path checkbox passes
**And** every Bearer-path checkbox passes.

**Given** any row fails in either path
**When** the failure is observed
**Then** the underlying bug is fixed and the row is re-tested before completion.

**Given** the checklist is complete
**When** every row is signed off
**Then** completion is recorded with a timestamp
**And** mobile-binary deployment to family devices is BLOCKED until this story completes.

### Story 1.9: Execute auth golden-path smoke test on production

As a solo developer who just deployed dual-auth to production,
I want a 10-assertion smoke test (5 endpoints × 2 paths) on production immediately after deploy,
So that I catch environment-specific regressions before any mobile client authenticates.

**Acceptance Criteria:**

**Given** dual-auth backend changes are deployed to production
**When** the developer runs the smoke test on the production URL
**Then** all 10 assertions pass:
- POST `/api/auth/login` returns 200 with `{ user, token }` and cookies set
- GET `/api/recipes` returns 200 via cookie AND via Bearer
- GET `/api/recipes/[id]` returns 200 via cookie AND via Bearer
- POST `/api/recipes/[id]/cook` returns 200 via cookie AND via Bearer
- GET `/api/feed` returns 200 via cookie AND via Bearer

**Given** any assertion fails
**When** the failure is observed
**Then** the dual-auth deploy is rolled back (single-commit revert)
**And** root cause is diagnosed before retry.

**Given** all 10 assertions pass
**When** the smoke test completes
**Then** the deploy is production-validated
**And** mobile-binary deployment is UNBLOCKED
**And** smoke test results are recorded in the deploy PR description.

---

## Epic 2: iOS App Bootstrap & Native Shell

Capacitor-wrap the deployed Next.js app into an installable iOS binary with native chrome — splash, icon, safe-area-aware layout, swipe-back, dark/light mode, Info.plist privacy declarations. App Store Review Guideline 4.2 polish baked into the foundation.

### Story 2.1: Initialize Capacitor 7.x in the existing Next.js repo

As a solo developer building the iOS app,
I want Capacitor 7.x initialized in the existing Simmer Next.js repo with the iOS platform added,
So that I have an installable iOS shell wrapping the deployed web app.

**Acceptance Criteria:**

**Given** the existing Simmer repo at clean main
**When** the developer runs `npm install @capacitor/core @capacitor/cli`, `npx cap init "Simmer" "com.simmer.mobile"`, `npm install @capacitor/ios`, `npx cap add ios`, then `npx cap sync ios`
**Then** the repo contains a new `ios/` directory with a working Xcode project
**And** `capacitor.config.ts` is created at repo root
**And** running `npx cap run ios` launches the Simulator displaying the production Simmer web app inside WKWebView.

**Given** the iOS bootstrap is complete
**When** existing `npm run dev` and `npm run build` are executed
**Then** both succeed unchanged — Capacitor does not break the web build pipeline.

**Given** Capacitor adds new files
**When** the developer commits
**Then** the `ios/` directory is checked into git per Capacitor convention.

### Story 2.2: Configure `capacitor.config.ts` server.url and allowNavigation

As a developer running the Capacitor wrap on iOS,
I want `capacitor.config.ts` to point WKWebView at the deployed Vercel domain with restricted navigation,
So that the app loads the production app and the WebView can't navigate to arbitrary external domains.

**Acceptance Criteria:**

**Given** the `capacitor.config.ts` file
**When** opened
**Then** `server.url` is set to the production Vercel domain (`https://simmer.vercel.app` or production URL)
**And** `allowNavigation` restricts WKWebView navigation to first-party + recipe-source domains.

**Given** a development environment
**When** developing locally
**Then** the config supports overriding `server.url` to `http://localhost:3000` (commented dev block or environment-aware).

### Story 2.3: Install full v1 Capacitor plugin set

As a developer wiring native capabilities,
I want the full v1 Capacitor plugin set installed and synced,
So that hooks built in later stories have their native APIs available.

**Acceptance Criteria:**

**Given** Capacitor is initialized
**When** the developer runs `npm install @capacitor/network @capacitor/preferences @capacitor/haptics @capacitor/status-bar @capacitor/splash-screen @capacitor/app @capacitor-community/secure-storage`
**Then** all 7 plugins appear in `package.json` dependencies
**And** `npx cap sync ios` completes without errors
**And** the iOS project's `Podfile.lock` records every plugin's native pod.

**Given** the plugin set is installed
**When** the binary is built
**Then** only App Store-permitted plugins ship (NFR33) and no plugin uses private iOS APIs.

### Story 2.4: Create `src/lib/native.ts` Capacitor isolation layer

As a developer adding native behavior to client components,
I want a single module that exposes `isNativePlatform()` runtime detection and barrel exports for Capacitor plugins,
So that Capacitor imports never leak directly into components.

**Acceptance Criteria:**

**Given** the file `src/lib/native.ts` is created
**When** opened
**Then** it exports `isNativePlatform()` wrapping `Capacitor.isNativePlatform()`
**And** it provides barrel re-exports for the plugins used by hooks (Network, Preferences, Haptics, StatusBar, App, SecureStorage).

**Given** any Capacitor-consuming hook
**When** authored
**Then** it imports only from `src/lib/native.ts`, never directly from `@capacitor/*`.

### Story 2.5: Produce iOS app icon set

As a family member installing Simmer,
I want a recognizable Simmer icon on my iPhone home screen,
So that the app feels like a real native app and competes with Messages/Instagram for the kitchen-launcher slot.

**Acceptance Criteria:**

**Given** the iOS Xcode project
**When** `ios/App/App/Assets.xcassets/AppIcon.appiconset/` is inspected
**Then** all required iPhone + iPad icon sizes (including 1024×1024 base) are present
**And** the icon is recognizable at 60×60 pt (smallest iOS size).

**Given** the binary is built and installed
**When** the device's home screen is viewed
**Then** the Simmer icon renders sharply with no missing-asset warnings.

### Story 2.6: Produce LaunchScreen.storyboard

As a user opening Simmer for the first time,
I want a brand-matched native launch screen before WKWebView mounts,
So that the first impression is native and there is no white flash.

**Acceptance Criteria:**

**Given** `ios/App/App/LaunchScreen.storyboard`
**When** the app is launched cold
**Then** the storyboard renders before WKWebView mounts
**And** the background uses the existing `background-elevated` color from the web Tailwind palette
**And** the launch transition into the WebView has no perceptible white flash.

**Given** the storyboard's foreground brand mark
**When** measured against the background
**Then** contrast is sufficient for clarity at all iPhone sizes.

### Story 2.7: Configure Info.plist (encryption export + App Privacy declarations)

As a developer preparing for Apple submission,
I want `Info.plist` to declare encryption-export exemption and the iOS App Privacy data-collection set,
So that App Store submission paperwork is in order and matches actual data handling.

**Acceptance Criteria:**

**Given** `ios/App/App/Info.plist`
**When** opened
**Then** `ITSAppUsesNonExemptEncryption` is set to `NO`
**And** App Privacy declarations enumerate the FR35 data set: email (account + friend search), name (display), recipe content, cook logs + ratings, partner/friend relationships
**And** no entry declares third-party tracking or advertising.

**Given** the App Privacy declarations
**When** compared to actual backend data collection
**Then** they match exactly (NFR30 sync).

### Story 2.8: Create SafeAreaLayout wrapper

As a user on an iPhone with a notch / Dynamic Island and home indicator,
I want app content to respect safe-area insets,
So that no nav bar element is occluded and no top content disappears under the notch.

**Acceptance Criteria:**

**Given** `src/components/safe-area-layout.tsx`
**When** mounted at the root layout
**Then** it applies `env(safe-area-inset-top/bottom/left/right)` via CSS so the bottom-tab nav clears the home indicator and top content clears the notch / Dynamic Island.

**Given** the layout
**When** rendered on web
**Then** behavior is a no-op (web has no safe-area insets); web layout is unaffected.

**Given** the layout
**When** rendered on iOS
**Then** the status bar respects safe-area top
**And** the implementation uses pure CSS with zero JavaScript runtime cost.

### Story 2.9: Verify iOS-native navigation (swipe-back + touch-only inherited flows)

As a family member using inherited web flows on iOS,
I want every nested-screen navigation to support the iOS swipe-from-left-edge back gesture and every interaction to work via touch alone,
So that the app feels native and no flow is broken on touch.

**Acceptance Criteria:**

**Given** the founder's iPhone with the binary installed
**When** the developer performs an iOS swipe-from-left-edge on every nested screen (recipe detail, friends, settings, friend search, recipe form)
**Then** the navigation returns to the parent screen in every case (FR40).

**Given** every inherited web flow (FR1–FR7 — recipe management, go-to signals, AI extraction, partner vault, friend connections, activity feed, account & auth)
**When** operated via touch only on iOS
**Then** every capability completes successfully with no hover-only, right-click, or keyboard-only paths required (FR41).

**Given** any flow that fails
**When** discovered
**Then** the delta is logged in `docs/mobile-parity-notes.md` for resolution before TestFlight invites.

### Story 2.10: Verify visual & responsive inheritance (dark mode + Dynamic Type + contrast + reduced motion)

As a user with iOS system preferences set,
I want the app to respect dark/light mode, Dynamic Type, contrast standards, and reduced-motion preferences,
So that the app respects my accessibility and visual preferences.

**Acceptance Criteria:**

**Given** the founder's iPhone with iOS system dark mode toggled
**When** the app is launched / reopened
**Then** all surfaces render correctly using Tailwind dark-mode variants (FR47, UX-DR23).

**Given** iOS system text-size set to largest accessibility option
**When** the app is opened
**Then** text scales without truncation or overflow up to the next Tailwind breakpoint (NFR27, UX-DR11).

**Given** the app's primary color pairs (accent-amber on background-elevated, foreground on background, foreground-muted on background)
**When** measured in both light and dark mode
**Then** contrast meets WCAG AA — 4.5:1 normal text, 3:1 large text (NFR29, UX-DR13).

**Given** iOS Reduce Motion toggled on
**When** the app is used
**Then** subtle transitions/animations are disabled per `prefers-reduced-motion` (UX-DR22).

### Story 2.11: Verify accessibility inheritance (44pt touch targets + VoiceOver for 5 common tasks + color independence)

As a user relying on assistive technology,
I want every interactive element to meet HIG touch-target sizing and announce meaningfully via VoiceOver,
So that the app is fully usable without sight or with reduced dexterity.

**Acceptance Criteria:**

**Given** every interactive element on inherited web flows
**When** measured on a real device
**Then** the touch zone meets 44×44 pt minimum, even when the visual element is smaller (NFR28, UX-DR12).

**Given** VoiceOver enabled
**When** the user attempts the 5 common tasks — library browse, recipe view (online + offline), log cook with rating, save from feed, unlink partner
**Then** each task completes via VoiceOver alone (NFR26, UX-DR20, P8).

**Given** every state that conveys information visually
**When** inspected
**Then** information is not conveyed by color alone — error states pair text + icon, offline state pairs banner + disabled controls (UX-DR21).

### Story 2.12: Audit binary for App Store-permitted plugins and zero analytics SDKs

As a developer preparing for Apple submission,
I want to verify the binary ships only App Store-permitted plugins and contains no analytics / telemetry / advertising SDKs,
So that NFR13/NFR33 are met and the App Privacy declaration's "no tracking" claim is honest.

**Acceptance Criteria:**

**Given** the iOS binary about to be archived
**When** the dependency tree is audited
**Then** only the 7 v1 Capacitor plugins (NFR37) are present
**And** no third-party analytics SDKs (Mixpanel, PostHog, Amplitude, etc.) are bundled
**And** no advertising SDKs are bundled (NFR13).

**Given** each Capacitor plugin in v1 set
**When** reviewed
**Then** none uses private iOS APIs (NFR33).

### Story 2.13: Verify inherited AI extraction failure → manual entry fallback on mobile

As a mobile user pasting a recipe URL that fails extraction,
I want the existing web fallback ("We couldn't extract this — want to add it by hand?") to surface in WKWebView,
So that I'm guided to manual entry instead of facing a broken screen.

**Acceptance Criteria:**

**Given** a recipe URL that returns no extractable content
**When** the user pastes it on mobile and waits for extraction
**Then** the existing web fallback to manual entry surfaces in WKWebView unchanged from web behavior (NFR20).

**Given** the fallback flow
**When** the user adds the recipe manually
**Then** the recipe is saved successfully via the standard authed write path.

### Story 2.14: Create `docs/mobile-polish-backlog.md` skeleton

As a solo developer running real-device QA,
I want a continuously-populated polish-backlog doc,
So that every divergence pressure observed during QA is captured for v2 consideration without derailing v1 ship.

**Acceptance Criteria:**

**Given** the file `docs/mobile-polish-backlog.md` does not yet exist
**When** the developer creates it
**Then** it includes a one-paragraph header explaining the meta-rule (per UX spec Step 3): "Any visual or behavior gap surfaced during mobile testing is captured here but not addressed in v1"
**And** it includes empty sections for: Visual gaps, Behavior gaps, Accessibility gaps, Performance gaps, Cross-device variance, Inherited-flow conflicts
**And** the file is referenced from `architecture-mobile.md`'s mobile-polish-backlog meta-rule (AR23, UX-DR25).

### Story 2.15: Verify smooth library scroll on a 3-year-old iPhone

As a user with an older iPhone,
I want the library list to scroll smoothly without jank,
So that browsing my recipes feels native, not laggy.

**Acceptance Criteria:**

**Given** the founder's 3-year-old test iPhone (or equivalent ≥ iPhone 11)
**When** the library is loaded with a representative recipe count (≥ 50 recipes)
**Then** scrolling renders smoothly without visible jank (NFR3, verified manually).

**Given** any observed jank
**When** captured
**Then** it is logged in `docs/mobile-polish-backlog.md` for v2 consideration (the inherited web component is the source of truth — no v1 rewrite).

---

## Epic 3: Mobile Sign-In & Session Persistence

Connect the mobile binary to the backend via Bearer-token auth, persisting the token in iOS Keychain with the right access class. Wire the first-launch flow, sliding-window refresh, and clean sign-out. Login/signup form copy follows inline-error conventions.

### Story 3.1: Implement Keychain secure-storage helper in `src/lib/native.ts`

As a mobile user signing in,
I want my session token persisted in iOS Keychain with the appropriate access class,
So that my session survives device reboot but does not sync to iCloud or survive app uninstall.

**Acceptance Criteria:**

**Given** `src/lib/native.ts`
**When** extended with `secureStorage` helpers (`setToken(token: string)`, `getToken(): Promise<string | null>`, `clearToken()`)
**Then** the helpers wrap `@capacitor-community/secure-storage`
**And** the access class is set to `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly` (FR42, NFR10).

**Given** the device is rebooted but unlocked once after reboot
**When** the app is opened
**Then** the persisted token is retrievable from Keychain.

**Given** the app is uninstalled and reinstalled
**When** the app is opened
**Then** the previously persisted token is no longer retrievable (expected behavior — the user must sign in again).

**Given** the device has not been unlocked since reboot
**When** the app attempts to read the token
**Then** the read fails gracefully and the app routes to the login screen.

### Story 3.2: Create `src/lib/api-client.ts` with Bearer header + 401 interceptor

As a mobile client making authed requests,
I want a single `apiClient` helper that attaches the Bearer header from Keychain and redirects to login on 401,
So that every authed request is consistently authenticated and expired tokens are handled centrally.

**Acceptance Criteria:**

**Given** `src/lib/api-client.ts` is created
**When** any authed mobile request is made
**Then** the helper reads the token from Keychain via `src/lib/native.ts`
**And** attaches it as `Authorization: Bearer <token>` (FR15).

**Given** the response to any authed request returns 401
**When** the interceptor processes the response
**Then** it clears the token from Keychain
**And** redirects the user to the login screen (FR18)
**And** the user sees an inline message in human language, never a status code (UX-DR24).

**Given** the response returns a non-401 server error
**When** rendered
**Then** the error message names the user's next action ("Try again", "Connect to save") — never "Error 500" (P9, UX-DR24).

### Story 3.3: Mobile login flow with email/password

As a family member signing in on the mobile app for the first time,
I want to enter my existing email + password and have my session persist in Keychain,
So that I don't have to sign in again on subsequent app launches.

**Acceptance Criteria:**

**Given** the user is on the login screen with no persisted token
**When** they enter valid email + password and tap "Log in"
**Then** the request hits `/api/auth/login`, the token is read from the response body, persisted via `secureStorage.setToken()`, and the user is routed to the library (FR13).

**Given** the user enters invalid credentials
**When** they tap "Log in"
**Then** an inline "Try again" message renders below the password field (no modal, no status code) (UX-DR16, UX-DR24).

**Given** the user is offline
**When** they tap "Log in"
**Then** an inline "Connect to sign in" message renders (UX-DR16, UX-DR24).

**Given** the login form
**When** rendered
**Then** the email field uses `inputmode="email"`, the password field is type="password", the keyboard "Return" key submits, the submit button is sticky above the keyboard with an inline spinner during the request (UX-DR16).

### Story 3.4: Mobile signup flow

As a new family member opening Simmer via TestFlight,
I want to create an account directly on mobile and have my session persist immediately,
So that I can use the app without needing to sign up on web first.

**Acceptance Criteria:**

**Given** the user is on the signup screen
**When** they enter valid email + name + password and tap "Sign up"
**Then** `/api/auth/signup` returns `{ user, token }`, the token is persisted in Keychain, and the user is routed forward per the first-launch flow (FR13, FR36).

**Given** the user enters a duplicate email
**When** they tap "Sign up"
**Then** an inline error renders ("That email is already in use — try logging in instead") with no status code surfaced.

**Given** signup succeeds
**When** the user reaches the library
**Then** they see the OnboardingModal because their `hasSeenOnboarding` is false (FR36).

### Story 3.5: Implement first-launch flow logic

As a returning user opening the mobile app,
I want zero friction between tap and library,
So that the home-screen tap is the entire interaction for an active session.

**Acceptance Criteria:**

**Given** the app launches and Keychain contains a valid token
**When** the user has not been signed out
**Then** the app routes directly to the library with no login screen interaction (FR36).

**Given** the app launches and Keychain has no token
**When** the launch flow evaluates
**Then** the app routes to the login screen.

**Given** the user signs in successfully
**When** the launch flow evaluates `User.hasSeenOnboarding`
**Then**:
- If `hasSeenOnboarding === false` → show the existing `OnboardingModal`
- If `hasSeenOnboarding === true` → route directly to the library

**And** **product decision (FR36 / pre-mortem #7 resolution):** a web-onboarded user (`hasSeenOnboarding === true`) installing mobile for the first time goes **directly to the library** — no mobile-specific welcome modal. This matches the PRD's literal specification of FR36 (Option A). Any future mobile-specific welcome message is captured in `mobile-polish-backlog.md` for v2.

### Story 3.6: Mobile sign-out

As a user signing out of mobile,
I want my session fully cleared from the device,
So that an attacker with my unlocked phone cannot impersonate me.

**Acceptance Criteria:**

**Given** the user is signed in
**When** they tap "Log out"
**Then** the helper calls `DELETE /api/auth/logout`
**And** `secureStorage.clearToken()` is invoked, removing the token from Keychain
**And** `queryClient.clear()` is invoked (FR33 — covered fully in Epic 4 Story 4.15; Epic 3 establishes the integration point)
**And** the user is routed to the login screen.

**Given** sign-out completes
**When** the device is rebooted and the app reopened
**Then** the user is prompted to sign in (token is not silently restored).

### Story 3.7: Inline error patterns for login & signup failure cases

As a user encountering an error during sign-in,
I want clear, action-naming inline messages — never status codes,
So that I know exactly what to do next.

**Acceptance Criteria:**

**Given** any error during login or signup (bad credentials, network failure, 5xx, 401 on subsequent authed request)
**When** the error renders
**Then** the message names the user's next action ("Try again", "Connect to sign in", "Check your email and try again") — never "Error 401" or "Network error 500" (P9, UX-DR24).

**Given** the error is shown inline
**When** rendered
**Then** it appears below the active field with destructive color (or as a banner if screen-level)
**And** never as a modal alert dialog (P9, Step 12 patterns).

---

## Epic 4: Offline-First Reading & Cache Lifecycle

Introduce TanStack Query as the data primitive, persisted via `@capacitor/preferences`. Build OfflineBanner, CacheTimestamp, useNetworkState, useAppResume. Implement pull-to-refresh and the full cache-invalidation surface (logout, partner unlink, friend removal, friend-request decline, stale-deleted, app-resume, network restore). FR34 is a standalone privacy-grade story per pre-mortem #2.

### Story 4.1: Install TanStack Query + persister packages

As a developer building the offline cache layer,
I want TanStack Query and its persister installed,
So that subsequent stories can wire the provider and migrate data fetching.

**Acceptance Criteria:**

**Given** the existing repo
**When** the developer runs `npm install @tanstack/react-query @tanstack/query-async-storage-persister @tanstack/react-query-persist-client`
**Then** the three packages appear in `package.json` dependencies (AR3)
**And** the install completes without peer-dependency warnings on React 19.

### Story 4.2: Configure TanStack Query client + persister in `src/lib/query-client.ts`

As a developer enabling offline reads,
I want a configured QueryClient with the persister wired to `@capacitor/preferences`,
So that cache state survives app restarts and offline reads work transparently.

**Acceptance Criteria:**

**Given** `src/lib/query-client.ts` is created
**When** opened
**Then** it exports a `QueryClient` instance with:
- `staleTime: 5 * 60 * 1000` (5 minutes) for default queries (AR16)
- `staleTime: Infinity` overrides applied per-query for recipe detail (AR16)
- A persister built from `@tanstack/query-async-storage-persister` backed by `@capacitor/preferences` (AR15)

**Given** the persister
**When** a cache write fails (storage full / corruption / schema mismatch on app upgrade)
**Then** the failure is caught and the cache falls back transparently to in-memory state (AR18, FR43)
**And** no user-visible error surfaces.

### Story 4.3: Mount `QueryClientProvider` + `PersistQueryClientProvider` at root layout

As a developer enabling app-wide cached data fetching,
I want the providers wired at the root layout,
So that every client component can issue TanStack Query queries and mutations.

**Acceptance Criteria:**

**Given** `src/app/layout.tsx`
**When** modified
**Then** it wraps children in `<PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>`
**And** the layout still renders the existing nav, server components, and content without regression.

### Story 4.4: Create `useNetworkState()` hook

As a developer gating write actions on connectivity,
I want a single source of truth for online/offline state,
So that every component shares the same network signal.

**Acceptance Criteria:**

**Given** `src/hooks/use-network-state.ts` is created
**When** invoked on iOS
**Then** it wraps `@capacitor/network` and returns `{ isOnline: boolean }` reactive to network status changes (UX-DR6, FR21).

**Given** the hook is invoked on web
**When** evaluated
**Then** it falls back to `navigator.onLine` so the same component code works in both runtimes.

### Story 4.5: Create OfflineBanner component

As a user with weak or no wifi,
I want a persistent, calm informational banner that tells me I'm offline and reading from cache,
So that I trust the data I see and know not to expect writes.

**Acceptance Criteria:**

**Given** the device transitions to offline
**When** the layout re-renders
**Then** `OfflineBanner` shows the text "You're offline — showing cached recipes" at the top of the layout (FR21, UX-DR1)
**And** the banner uses muted-foreground text on `background-elevated` (never alarmist styling).

**Given** the device is offline
**When** the user attempts to dismiss the banner
**Then** dismissal is not possible — the banner remains until network returns (FR39).

**Given** the device transitions to online
**When** detected
**Then** the banner auto-dismisses (FR37).

**Given** VoiceOver is enabled
**When** the banner appears
**Then** it announces "You are offline. The app is showing cached recipes." with `role="status"` (NFR26, UX-DR1).

**Given** the banner is mounted on web
**When** rendered
**Then** it falls back to web's `navigator.onLine` behavior (no Capacitor dependency surfaces).

### Story 4.6: Create `useAppResume()` hook + wire `invalidateQueries` on foreground

As a user reopening the app after several minutes backgrounded,
I want library and feed data to refresh silently,
So that I see fresh data without pulling to refresh.

**Acceptance Criteria:**

**Given** `src/hooks/use-app-resume.ts` is created
**When** mounted at the root layout
**Then** it listens for `@capacitor/app` `appStateChange` events (UX-DR5)
**And** on foreground transition it invokes `queryClient.invalidateQueries` for library + feed queries (FR23).

**Given** recipe-detail queries (which have `staleTime: Infinity`)
**When** the app foregrounds
**Then** they are NOT auto-invalidated (preserved per AR16; only invalidate on explicit pull-to-refresh).

### Story 4.7: Migrate RecipeLibrary to TanStack Query

As a user opening the library,
I want my recipes, partner recipes, and saved recipes to load from cache instantly and refresh in the background,
So that the cold-start library appears within 2.5 seconds even when the network is slow.

**Acceptance Criteria:**

**Given** `RecipeLibrary` previously fetched via direct `fetch`
**When** migrated
**Then** it queries via TanStack Query with `staleTime: 5min` (FR19, NFR1, NFR7).

**Given** the user has visited the library at least once online
**When** they reopen the app offline
**Then** the library renders from the persisted cache
**And** the partner vault + saved recipes are present.

**Given** the library is rendered
**When** the user pulls down to refresh
**Then** `refetchQueries` is triggered (handled in Story 4.11).

**Given** filters and search are operated
**When** the user types or toggles a filter
**Then** they apply instantly client-side (NFR7, inherited from web).

### Story 4.8: Migrate FeedList to TanStack Query

As a user opening the feed,
I want recent friend activity to load from cache instantly and refresh on background → foreground or pull-to-refresh,
So that the feed feels responsive even at the stove.

**Acceptance Criteria:**

**Given** `FeedList` previously polled via `useFeedPolling`
**When** migrated
**Then** it queries the feed via TanStack Query with `staleTime: 5min` and a 30-second `refetchInterval` while in foreground (FR19, NFR25).

**Given** the app is backgrounded
**When** the foreground visibility check returns false
**Then** the feed query stops polling — battery preservation behavior is preserved (NFR25).

**Given** the device is offline
**When** the feed is opened
**Then** the last 50 cached feed events render
**And** no network errors surface to the user.

### Story 4.9: Migrate RecipeDetail to TanStack Query

As a user opening a recipe at the stove,
I want the recipe to render in ≤ 500ms from cache when offline (after first view) and ≤ 1s online,
So that there's no friction between tap and recipe.

**Acceptance Criteria:**

**Given** `RecipeDetail` previously fetched via direct `fetch`
**When** migrated
**Then** it queries via TanStack Query with `staleTime: Infinity` (refetch only on explicit pull-to-refresh) (FR20, AR16).

**Given** a recipe has been viewed online previously
**When** the user opens it offline
**Then** it renders from cache in ≤ 500 ms (NFR2).

**Given** the user opens a recipe online over 4G
**When** the request completes
**Then** the recipe renders in ≤ 1 second (NFR4).

### Story 4.10: Migrate mutations (cook log, save-from-feed, recipe form, friend/partner) to TanStack Query

As a user performing any write action,
I want the action to show success immediately and revert only on confirmed failure,
So that perceived latency is < 100 ms even on slow networks.

**Acceptance Criteria:**

**Given** any user-initiated write (cook log, save-from-feed, friend request, partner invite, recipe create/edit)
**When** the user taps the action
**Then** the UI optimistically shows the success state immediately (P5)
**And** the request is fired via TanStack Query's `useMutation` with `onMutate` / `onError` / `onSuccess` lifecycle.

**Given** the mutation succeeds server-side
**When** the success response is received
**Then** the optimistic state is confirmed and the success state persists (NFR17).

**Given** the mutation fails server-side
**When** the error is received
**Then** the UI reverts to the pre-action state
**And** an inline retry banner appears with action-naming copy (P9).

**Given** the mutation network-fails
**When** TanStack Query detects the failure
**Then** mutations do NOT auto-retry (avoids accidental duplicates per architecture's process patterns).

### Story 4.11: Implement pull-to-refresh on Library, Feed, and recipe detail

As a user wanting fresh data right now,
I want to pull down on any list or detail view to trigger a manual refresh,
So that I can confirm I'm looking at the latest data even when the app didn't auto-refresh.

**Acceptance Criteria:**

**Given** the Library, Feed, or recipe detail view is displayed
**When** the user performs a pull-down gesture
**Then** `refetchQueries` is triggered for the relevant query
**And** the result either renders fresh data or shows an "up to date" indicator within 2 seconds (NFR6, FR38).

**Given** pull-to-refresh is in flight
**When** the user sees the loading indicator
**Then** it is the inline spinner pattern from UX-DR15 — not a toast and not a full-screen overlay.

### Story 4.12: Create CacheTimestamp component on recipe detail

As a user viewing a cached recipe,
I want to see how long ago it was fetched,
So that I can trust whether the data is current or stale.

**Acceptance Criteria:**

**Given** the recipe-detail view is rendered
**When** mounted
**Then** `CacheTimestamp` reads `dataUpdatedAt` from TanStack Query's cache for that recipe (FR22, UX-DR2)
**And** displays:
- "Updated now" (< 1 min)
- "Updated N min ago" (1–59 min)
- "Updated N hr ago" (1–23 hr)
- "Updated N days ago" (≥ 24 hr)

**Given** the recipe-detail query is refetched
**When** `dataUpdatedAt` changes
**Then** the label re-renders with the new value.

**Given** VoiceOver is enabled
**When** the label is read
**Then** the full natural-language text is announced via `role="status"`.

### Story 4.13: Disable write actions when offline with inline "Connect to save"

As an offline user trying to log a cook or save a recipe,
I want write controls disabled with a clear inline explanation,
So that I'm not confused about why my tap didn't work.

**Acceptance Criteria:**

**Given** `useNetworkState()` returns `isOnline === false`
**When** any write control (cook log, save-from-feed, friend request, partner invite, recipe create/edit submit) is rendered
**Then** the control is disabled
**And** an inline "Connect to save" (or context-specific equivalent: "Connect to log your cook", "Connect to send your invite") renders next to or below the control (FR24, UX-DR15).

**Given** the offline state
**When** the user attempts to tap the disabled control
**Then** no request is fired
**And** no success state is shown (avoids confusing optimistic UI).

### Story 4.14: Auto-refresh and dismiss offline banner on offline → online transition

As a user moving back into wifi range,
I want the offline banner to disappear automatically and the data to refresh silently,
So that I don't have to manually re-enable the app.

**Acceptance Criteria:**

**Given** the device is offline and the banner is displayed
**When** `useNetworkState()` detects the transition to online
**Then** within 5 seconds (NFR18):
- The offline banner dismisses (FR37)
- Library and feed queries are invalidated and refetched
- Write controls re-enable

**Given** the foreground state during the transition
**When** all refreshes complete
**Then** the UI is back to live-online state with no manual action required.

### Story 4.15: Implement `queryClient.clear()` on logout

As a user signing out,
I want all my cached data wiped from the device,
So that the next person to open the app cannot see anything from my session.

**Acceptance Criteria:**

**Given** the sign-out flow from Epic 3 Story 3.6
**When** the user signs out
**Then** `queryClient.clear()` is invoked (FR33)
**And** all persisted cache entries are removed from `@capacitor/preferences`.

**Given** the cache is cleared
**When** a different user signs in (or the same user signs back in)
**Then** the library, feed, and recipe detail data is freshly fetched from the API — no leaked cache from the prior session.

### Story 4.16: Access-control cache invalidation on partner unlink, friend removal, friend-request decline (privacy-critical)

As a user who has just unlinked my partner or removed a friend,
I want their content to disappear from my cached library immediately and remain inaccessible offline,
So that access control is honored even on a cached read.

**Acceptance Criteria:**

**Given** the user has a partner with a linked vault and partner recipes are present in the persisted cache
**When** the user unlinks the partner (mutation completes server-side)
**Then** TanStack Query `invalidateQueries` fires for partner-vault and partner-recipe query keys (FR34)
**And** the partner-recipe entries are removed from the persisted cache backing in `@capacitor/preferences`.

**Given** the partner has been unlinked
**When** the app is closed and reopened offline
**Then** the partner's recipes do NOT appear in the cached library
**And** any direct cached recipe-detail entry for a partner recipe also does not surface.

**Given** the user has a friend with content in the activity feed cache and saved recipes from that friend
**When** the friend is removed (mutation completes)
**Then** equivalent invalidation logic fires for friend-feed and saved-from-friend entries
**And** the same offline-reopen test verifies no leaked content.

**Given** the user declines an incoming friend request
**When** the mutation completes
**Then** related cache entries (pending-request badge, if any cached friend content surfaces) are invalidated.

**And** verification is performed manually on a real device per Epic 7's cache-invalidation verification (NFR43).

### Story 4.17: Handle stale-deleted recipes gracefully

As a user tapping a recipe that no longer exists,
I want a clear "no longer available" message and the stale entry removed from cache,
So that I'm not stuck on a broken view.

**Acceptance Criteria:**

**Given** a recipe is present in the persisted cache but has been deleted on the server
**When** the user taps the recipe and the request returns 404
**Then** the detail view displays "This recipe is no longer available" (FR44)
**And** the cache entry for that recipe is removed
**And** the library list refreshes to exclude the stale entry on next refetch.

**Given** the message is shown
**When** the user taps back / closes the view
**Then** the user is returned to the library without a dead-end state.

### Story 4.18: Verify CSP image fallback chain on mobile

As a user viewing a recipe whose source image is blocked by CSP,
I want the existing image fallback (cuisine → dish → protein → gradient hash) to render in its place,
So that no recipe ever appears with a broken or missing image.

**Acceptance Criteria:**

**Given** a recipe whose source image domain is NOT on the CSP allowlist (from Epic 1 Story 1.5)
**When** the detail view renders on mobile
**Then** the image fails to load, the existing fallback chain in `src/lib/recipe-images.ts` activates, and a deterministic image renders (FR45).

**Given** the same recipe on web
**When** rendered
**Then** the fallback behavior is identical — no regression versus pre-CSP behavior.

### Story 4.19: Empty state copy for Library, Feed, Want-to-try, Friend search

As a user encountering an empty list,
I want a helpful empty state with a clear next action,
So that no screen is ever a blank dead-end (P4 — one obvious next action).

**Acceptance Criteria:**

**Given** a user with no recipes in their library
**When** the library is rendered
**Then** the empty state shows: "Your library is empty. Paste a recipe URL or save one from the feed to get started." + a primary "Add a recipe" CTA (UX-DR18).

**Given** a user with no friend activity
**When** the feed is rendered
**Then** the empty state shows: "No activity yet. When friends cook or save recipes, you'll see it here." + a secondary "Find friends" CTA.

**Given** a user with no saved recipes
**When** the "Want to try" view is rendered
**Then** the empty state shows: "Recipes you save will appear here." (no CTA — list fills naturally).

**Given** a friend search returns zero results
**When** rendered
**Then** the empty state shows: "No one found. Friends need to sign up first."

**Given** any empty state
**When** rendered
**Then** it uses the existing typography scale with no large illustrations (kept calm per E2).

---

## Epic 5: Cook Mode at the Stove

The flagship mobile moment. Cook mode toggle holds the screen awake, dims the status bar, switches to large-font typography, and recovers cleanly from interruptions. New interactive surface requires VoiceOver coverage acceptance criteria per pre-mortem #4.

### Story 5.1: Verify inherited cook mode enter/exit on mobile WKWebView

As a user familiar with web cook mode,
I want the inherited cook-mode enter/exit interaction to work unchanged on iOS,
So that there's no behavioral surprise versus the web experience I already know.

**Acceptance Criteria:**

**Given** any recipe-detail view the user can access (own, partner's, friend's, or saved)
**When** the user taps "Cook mode"
**Then** the existing web cook-mode interaction activates inside WKWebView with no behavioral delta (FR25).

**Given** cook mode is active
**When** the user taps exit
**Then** cook mode exits cleanly and the recipe-detail view restores its default chrome.

**Given** any observed delta from web behavior
**When** discovered
**Then** logged in `docs/mobile-parity-notes.md`.

### Story 5.2: Verify Screen Wake Lock acquires ≤ 500 ms in WKWebView

As a user entering cook mode at the stove,
I want the screen wake lock to acquire fast enough that the screen never sleeps even briefly,
So that I never have to wake the phone with sticky hands.

**Acceptance Criteria:**

**Given** cook mode is entered on the founder's iPhone in WKWebView
**When** the existing `useWakeLock` hook runs
**Then** the wake lock acquires within 500 ms of cook-mode entry (NFR5, FR26).

**Given** cook mode is active
**When** the user is reading the recipe
**Then** the screen does not sleep for the duration of cook mode.

**Given** cook mode is exited or the app is backgrounded
**When** the exit/background event fires
**Then** the wake lock is released cleanly (FR26).

**Given** real-device testing reveals any wake-lock reliability issue
**When** documented
**Then** it is logged in `docs/mobile-parity-notes.md` for resolution before TestFlight invites.

### Story 5.3: Create `useStatusBarMode()` hook and integrate with cook mode

As a user in cook mode,
I want the status bar to dim to match the cook-mode theme,
So that the screen has less visual noise during a focused cooking session.

**Acceptance Criteria:**

**Given** `src/hooks/use-status-bar-mode.ts` is created
**When** invoked
**Then** it exposes `setMode('default' | 'cook-mode')` wrapping `@capacitor/status-bar` (UX-DR4).

**Given** cook mode is entered on `RecipeDetail`
**When** the entry effect fires
**Then** `setMode('cook-mode')` dims the status bar (FR27).

**Given** cook mode is exited
**When** the exit effect fires
**Then** `setMode('default')` restores the status bar.

**Given** the hook is called on web
**When** evaluated
**Then** it is a no-op (preserves web behavior).

### Story 5.4: Cook-mode large typography

As a user reading recipe steps from arm's length at the stove,
I want step text in a noticeably larger font when cook mode is active,
So that I can read without bending over the phone.

**Acceptance Criteria:**

**Given** cook mode is entered
**When** the step display renders
**Then** step text uses `text-2xl` to `text-3xl` from the existing Tailwind scale (UX-DR8)
**And** the typography is readable from arm's length on the founder's test device.

**Given** cook mode is exited
**When** the recipe-detail view restores
**Then** step text returns to the standard `text-base` scale.

**Given** iOS Dynamic Type is set to a larger system text size
**When** cook mode is active
**Then** the large typography scales further with Dynamic Type without truncation (NFR27).

### Story 5.5: Cook-mode interruption recovery

As a user whose phone call interrupts cook mode,
I want the wake lock to release gracefully and cook mode to be one-tap re-entrant from where I was,
So that an interruption doesn't lose my place in the recipe.

**Acceptance Criteria:**

**Given** cook mode is active
**When** a phone call, battery warning, or app backgrounding occurs
**Then** the wake lock releases gracefully (UX-DR19, Critical Moment #10).

**Given** the interruption ends and the app foregrounds
**When** the recipe-detail view re-renders
**Then** the recipe is still displayed from cache (or re-fetched, depending on staleTime)
**And** the cook-mode entry button is visible with one-tap re-entry
**And** the step scroll position is preserved.

**Given** cook mode is re-entered after interruption
**When** the entry effect fires
**Then** wake lock re-acquires within 500 ms and status bar re-dims.

### Story 5.6: Cook-mode VoiceOver coverage

As a VoiceOver user cooking with the app,
I want every new cook-mode interactive surface to announce meaningfully,
So that I can enter, navigate, and exit cook mode without sight (per pre-mortem #4 / UX-DR20 extension).

**Acceptance Criteria:**

**Given** VoiceOver is enabled
**When** the user lands on a recipe-detail view
**Then** the "Cook mode" primary button announces with a meaningful label (e.g., "Enter cook mode, keeps screen awake").

**Given** cook mode is active with VoiceOver enabled
**When** the user swipes through the screen
**Then** the large-typography step display is announced naturally (the existing step semantics are preserved by the typography size change)
**And** the cook-mode exit affordance is reachable and meaningfully labeled.

**Given** the status bar transitions to dim mode
**When** announced
**Then** VoiceOver does not over-announce decorative state changes (status-bar dim is decorative, not informational).

**Given** VoiceOver-tested cook mode
**When** completed in the Epic 7 QA pass
**Then** the cook-mode flow completes via VoiceOver alone, satisfying UX-DR20 / P8.

---

## Epic 6: Native Outcome Feedback (Haptics)

Three haptic moments — cook log saved, save-from-feed, partner unlinked. Per pre-mortem #4 + #8, every story includes a VoiceOver pairing AC and a multi-device perception AC.

### Story 6.1: Create `useHapticFeedback()` hook with three named functions

As a developer integrating haptics on outcome moments,
I want a single hook exposing three named haptic functions,
So that haptic invocations are centralized and Capacitor's API is isolated from components.

**Acceptance Criteria:**

**Given** `src/hooks/use-haptic-feedback.ts` is created
**When** invoked
**Then** it returns `{ confirmCookLog, confirmSaveFromFeed, confirmPartnerUnlink }` (UX-DR3)
**And** each function invokes `@capacitor/haptics` `Haptics.impact({ style: ImpactStyle.Medium })` on iOS.

**Given** the hook is invoked on web
**When** any function is called
**Then** it is a no-op (preserves web behavior).

**Given** a component using the hook
**When** authored
**Then** it imports only from `src/hooks/use-haptic-feedback.ts` — never directly from `@capacitor/haptics`.

### Story 6.2: Trigger haptic on cook log

As a user marking a recipe as cooked,
I want a physical haptic confirmation,
So that the most-important action of the kitchen-context loop feels real.

**Acceptance Criteria:**

**Given** the user is on a recipe detail or cook-mode view
**When** they submit the "Mark as cooked" action
**Then** `confirmCookLog()` fires (FR28)
**And** the haptic is paired with optimistic visual confirmation ("Logged" state with rating prompt).

**Given** VoiceOver is enabled
**When** the cook log fires
**Then** the visual confirmation is announced (haptic alone is not the only feedback channel — UX-DR21).

**Given** the cook log is verified on at least 2 iPhone generations from the family cohort (e.g., iPhone 11 / 13 / 15)
**When** the haptic fires
**Then** it is perceptible on each device tested
**And** any cross-device variance is captured in `docs/mobile-polish-backlog.md` (per pre-mortem #8).

### Story 6.3: Trigger haptic on save-from-feed

As a user saving a recipe from a friend's cook in the feed,
I want a physical haptic confirmation,
So that the discovery → vault loop closes with a precise outcome signal.

**Acceptance Criteria:**

**Given** the user is viewing a feed item or a recipe detail reached from the feed
**When** they tap "Save to Want to try"
**Then** `confirmSaveFromFeed()` fires (FR29)
**And** the haptic is paired with optimistic UI ("Saved" state on the recipe).

**Given** VoiceOver is enabled
**When** the save fires
**Then** the visual confirmation is announced (UX-DR21).

**Given** multi-device verification on ≥ 2 iPhone generations
**When** the haptic fires
**Then** perceptible on each device tested; cross-device variance logged in polish-backlog.

### Story 6.4: Trigger haptic on partner unlink

As a user severing a partner connection,
I want a physical haptic confirmation that this consequential action took effect,
So that I have unambiguous feedback for a destructive action.

**Acceptance Criteria:**

**Given** the user is on the partner section / settings
**When** they confirm an unlink
**Then** `confirmPartnerUnlink()` fires (FR30)
**And** the haptic is paired with visual confirmation that the partner vault is now unlinked.

**Given** VoiceOver is enabled
**When** the unlink confirms
**Then** the visual confirmation announces (UX-DR21).

**Given** the unlink completes
**When** Epic 4 Story 4.16 cache-invalidation runs
**Then** the partner's content is cleared from the cache as designed (cross-references the privacy-critical FR34 story).

**Given** multi-device verification on ≥ 2 iPhone generations
**When** the haptic fires
**Then** perceptible on each device tested; cross-device variance logged.

### Story 6.5: Multi-device haptic perception verification

As a solo developer about to ship haptics to family,
I want explicit cross-device verification of haptic perception,
So that the haptic doesn't render imperceptibly on older iPhones in the family cohort.

**Acceptance Criteria:**

**Given** at least 2 iPhone generations from the family cohort (preferably 3) — for example iPhone 11, iPhone 13, iPhone 15
**When** each of the 3 haptic moments (cook log, save-from-feed, partner unlink) fires on each device
**Then** the haptic is perceptible on each device tested.

**Given** any device where any haptic feels imperceptibly weak
**When** observed
**Then** the variance is captured in `docs/mobile-polish-backlog.md` with the device model + iOS version (per pre-mortem #8).

**Given** the variance is captured
**When** Epic 7 TestFlight invites are sent
**Then** affected family members are forewarned (or the haptic intensity is revised in a polish iteration).

---

## Epic 7: Real-Device Validation & TestFlight Launch

Manual verification gates substitute for the missing automated test net. Per pre-mortem refinements: family device-compatibility audit, App Store readiness audit, per-epic VoiceOver QA, and explicit non-goal measurement-posture documentation. Apple Developer enrollment ✅ already complete.

### Story 7.1: Audit family member iPhone iOS versions (pre-invite)

As a solo developer about to invite family to TestFlight,
I want a confirmed roster of every prospective family member's iPhone iOS version,
So that I don't send invites to devices below the iOS 16+ floor (per pre-mortem #5).

**Acceptance Criteria:**

**Given** the prospective family-cohort invite list
**When** the developer surveys each member's iPhone iOS version (text, call, or in person)
**Then** every device's iOS version is recorded
**And** every device with iOS 16+ is confirmed eligible for invite.

**Given** any device below iOS 16
**When** identified
**Then** an explicit decision is made and recorded: upgrade the device, defer the invite, or accept reduced rollout.

**Given** the audit is complete
**When** TestFlight invites are sent
**Then** no invite is sent to a sub-floor device.

### Story 7.2: Create `docs/mobile-parity-notes.md`

As a solo developer encountering WKWebView behavior deltas during real-device QA,
I want a single document where every delta from web behavior is logged,
So that future maintainers know which behaviors diverge and why.

**Acceptance Criteria:**

**Given** the file `docs/mobile-parity-notes.md` does not yet exist
**When** created
**Then** it includes a one-paragraph header explaining its purpose (NFR42 / AR22)
**And** initial sections for: Cookie / auth deltas, Wake lock reliability, Secure storage edge cases, Status bar interactions, Plugin-version compatibility, Inherited-flow behavior deltas
**And** it is referenced from `architecture-mobile.md`.

**Given** the QA passes that follow (Stories 7.3, 7.5)
**When** any delta is observed
**Then** it is logged in this document with device model + iOS version + observed behavior + expected behavior.

### Story 7.3: Real-device QA pass on founder's iPhone (full feature traversal)

As a solo developer about to invite family,
I want a documented complete-feature QA pass executed on the founder's iPhone,
So that no functional regression goes undetected before family invites.

**Acceptance Criteria:**

**Given** the founder's iPhone with the latest mobile binary installed
**When** the founder executes a documented QA pass covering: signup, login on cold install, library browse, recipe view (online + offline), cook mode + wake lock, cook log + rating, save-from-feed, partner invite + accept, partner unlink, logout
**Then** every flow completes successfully end-to-end (NFR41).

**Given** any flow fails
**When** observed
**Then** a fix is implemented and the flow is re-tested.

**Given** the QA pass also explicitly verifies cache-invalidation behaviors
**When** executed
**Then** FR23 (app-resume), FR34 (access-control changes), FR37 (network transition), and FR44 (stale-deleted recipe) each pass on the device (NFR43).

**Given** the QA pass is complete
**When** signed off
**Then** the completion is recorded with a timestamp and any caveats noted in `docs/mobile-parity-notes.md`.

### Story 7.4: Pre-submission native polish audit (App Store readiness gate)

As a solo developer preparing the first Apple TestFlight beta-review submission,
I want an integrated native-polish audit cross-referencing every contributing epic,
So that App Store Review Guideline 4.2 ("looks like a website") rejection is avoided (per pre-mortem #1).

**Acceptance Criteria:**

**Given** the candidate TestFlight build
**When** the audit checklist is executed, every box must pass:
- Epic 2: splash screen renders before WKWebView; app icon displays at all required sizes; safe areas respected; swipe-back works on all nested flows; dark/light mode reactive; status bar styled in default mode; App Privacy declarations in Info.plist
- Epic 5: cook-mode status bar dimming activates; cook-mode large typography activates; interruption recovery preserves state
- Epic 6: all 3 haptic moments fire on user actions, paired with visual confirmation

**Given** any box fails the audit
**When** observed
**Then** the gap is closed before submission — submission is BLOCKED until every box passes (NFR32, NFR34).

**Given** every box passes
**When** the audit is signed off
**Then** the build proceeds to TestFlight upload (Story 7.7).

### Story 7.5: Per-epic VoiceOver QA pass

As a solo developer with assistive-tech-using family members on the invite list,
I want VoiceOver-specific QA across every epic's contribution,
So that UX-DR20 / P8 coverage doesn't silently regress (per pre-mortem #4).

**Acceptance Criteria:**

**Given** the founder's iPhone with VoiceOver enabled
**When** the QA pass executes per-epic checks:
- Epic 2: inherited flows — 5 common tasks (library browse, recipe view, log cook, save from feed, unlink partner) complete via VoiceOver alone
- Epic 4: OfflineBanner announces "You are offline..." with `role="status"`; CacheTimestamp announces freshness naturally
- Epic 5: cook-mode toggle, step navigation, exit affordance all announce meaningfully
- Epic 6: each haptic moment is paired with an announced visual confirmation (haptic alone is never the sole feedback)

**Then** every per-epic VoiceOver check passes.

**Given** any check fails
**When** observed
**Then** the fix is implemented and re-tested
**And** the gap is recorded in `docs/mobile-parity-notes.md` if it requires a follow-up.

### Story 7.6: Subscribe to Vercel + Postgres status feeds

As a solo developer with no on-call rotation,
I want passive backend-incident awareness through status-page subscriptions,
So that I learn about production incidents from a notification rather than family bug reports.

**Acceptance Criteria:**

**Given** the founder's email or notification channel
**When** subscribed to `vercel-status.com` notifications (AR26, NFR46)
**Then** future Vercel incidents trigger a notification to the founder.

**Given** the managed-Postgres provider's status feed
**When** subscribed
**Then** future Postgres incidents trigger a notification.

**Given** both subscriptions are active
**When** verified
**Then** the verification is logged in `docs/mobile-parity-notes.md` or `docs/development-guide.md`.

### Story 7.7: Set up TestFlight distribution channel and upload first build

As a solo developer ready to ship,
I want the TestFlight distribution pipeline configured and the first beta build uploaded,
So that family invites can be sent.

**Acceptance Criteria:**

**Given** the App Store Connect record for Simmer Mobile does not yet exist
**When** the developer creates it
**Then** the app record is configured with name, bundle ID (`com.simmer.mobile`), category, and the family tester list (placeholder until Story 7.9) (AR25).

**Given** the candidate build that passed Story 7.4 (native polish audit)
**When** the developer archives in Xcode and uploads to App Store Connect
**Then** the build appears in TestFlight within ~15 minutes
**And** is ready for beta-review submission (Story 7.8).

### Story 7.8: Submit first build to Apple beta review and handle iteration

As a solo developer aiming for first-or-second-submission TestFlight approval,
I want to submit the build to Apple's beta review and handle any feedback,
So that TestFlight becomes available to invitees.

**Acceptance Criteria:**

**Given** the TestFlight build is uploaded
**When** the developer submits for beta review
**Then** Apple processes the submission within their standard window.

**Given** Apple approves the build on first submission
**When** approval lands
**Then** the build is ready for family invites (Story 7.9) (NFR34).

**Given** Apple rejects the first submission
**When** the rejection reason is reviewed
**Then** the underlying gap is fixed (most likely a native-polish issue from Story 7.4's audit; budget ~1 week for iteration per PRD risk-mitigation strategy)
**And** the build is re-submitted; success expected on second submission per NFR34's target.

### Story 7.9: Send TestFlight invites to family cohort

As a solo developer with TestFlight approved,
I want to send invite links to the audited family cohort,
So that v1 reaches its target users.

**Acceptance Criteria:**

**Given** TestFlight approval is granted (Story 7.8)
**When** the developer adds the audited family members from Story 7.1 to the TestFlight tester list
**Then** each family member receives an invite link.

**Given** family members install via the link
**When** each first launches the app
**Then** the Story 3.5 first-launch flow runs as designed (login screen for new sessions; library for restored sessions; OnboardingModal for new users) (FR8).

**Given** any family member's install fails for a reason not caught by Story 7.1 audit
**When** discovered
**Then** the issue is documented in `docs/mobile-parity-notes.md` for v2 prevention.

### Story 7.10: Document non-goal measurement posture

As a future maintainer wondering why v1 has no crash reporter,
I want explicit documentation that v1 ships without crash / analytics / telemetry SDKs by design,
So that the architectural choice is preserved and not misread as an oversight.

**Acceptance Criteria:**

**Given** the documentation surface (likely `docs/development-guide.md` or `docs/mobile-parity-notes.md`)
**When** updated
**Then** it states explicitly: "v1 ships WITHOUT crash reporting, analytics, or telemetry SDKs. Success-criteria metrics are tracked via direct family-cohort conversation and manual founder observation. Targets in NFR16 (crash-free ≥ 99.5%) and NFR22 (battery / cache / network) are directional, not instrumented." (NFR45)
**And** v2 candidates for adding crash reporting (e.g., Sentry) and lightweight privacy-respecting analytics (e.g., self-hosted PostHog) are listed.

### Story 7.11: Establish iOS major-release compatibility cadence

As a future maintainer planning iOS-version maintenance,
I want a documented compatibility-review cadence,
So that each iOS major release is reviewed before family devices upgrade and find the app broken.

**Acceptance Criteria:**

**Given** `docs/development-guide.md` (or equivalent)
**When** updated
**Then** it documents the maintenance cadence: "Within 2 weeks of each iOS major release, skim the Capacitor changelog and run a real-device build at iOS major-version GA. Document any compatibility issues in `docs/mobile-parity-notes.md`." (NFR47)

**Given** the cadence is documented
**When** the next iOS major release ships
**Then** the founder is reminded by the documented schedule.

### Story 7.12: Track crash-free session directional target

As a solo developer with no crash reporter in v1,
I want the directional crash-free target acknowledged in documentation,
So that the target is not forgotten even though it isn't instrumented.

**Acceptance Criteria:**

**Given** `docs/mobile-parity-notes.md`
**When** updated
**Then** it states the directional crash-free target (NFR16: ≥ 99.5%) and the directional resource-consumption targets (NFR22: battery, cache, network) explicitly as non-measured in v1
**And** acknowledges that any family-reported crashes constitute observable signal that the directional target may have been violated
**And** crash reporter integration is listed as a v2 candidate per Story 7.10.

### Story 7.13: Update mobile-polish-backlog with continuous QA findings

As a solo developer finishing v1 QA,
I want `docs/mobile-polish-backlog.md` to capture every divergence pressure observed during Stories 7.3, 7.4, 7.5,
So that v2 starts with a clear inventory of polish work rather than rediscovering them from memory.

**Acceptance Criteria:**

**Given** the QA passes from Stories 7.3, 7.4, and 7.5
**When** any visual gap, behavior gap, accessibility gap, performance gap, cross-device variance, or inherited-flow conflict is observed
**Then** it is logged in the appropriate section of `docs/mobile-polish-backlog.md` with: observed device, iOS version, expected vs. actual behavior, and any relevant epic / story reference (UX-DR25).

**Given** the v1 ship is complete
**When** v2 planning begins
**Then** the backlog is the starting inventory for v2 polish work.

---

## Workflow Complete

All 7 epics decomposed into actionable stories. **Total: 74 stories** across the v1 build.

| Epic | Stories | Primary surface |
|---|---|---|
| Epic 1: Mobile-Ready Backend Foundation | 9 | Backend dual-auth, CSP, sanitization, regression checklist |
| Epic 2: iOS App Bootstrap & Native Shell | 15 | Capacitor bootstrap, native chrome, accessibility scaffold |
| Epic 3: Mobile Sign-In & Session Persistence | 7 | Keychain, login/signup, first-launch flow, sign-out |
| Epic 4: Offline-First Reading & Cache Lifecycle | 19 | TanStack Query, offline UX, cache invalidation (incl. FR34 privacy story) |
| Epic 5: Cook Mode at the Stove | 6 | Wake lock, status bar dim, large typography, interruption recovery |
| Epic 6: Native Outcome Feedback (Haptics) | 5 | useHapticFeedback + 3 outcome moments + multi-device verification |
| Epic 7: Real-Device Validation & TestFlight Launch | 13 | QA gates, App Store readiness audit, family invites, ops |

Every FR, NFR, AR, and UX-DR from the requirements inventory is covered by at least one story. Pre-mortem refinements (#1 App Store audit, #2 FR34 standalone, #4 per-epic VoiceOver, #5 device audit, #7 FR36 product decision recorded, #8 multi-device haptic) are folded into specific story acceptance criteria.
