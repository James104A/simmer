---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments:
  - docs/architecture.md
  - docs/api-contracts.md
  - docs/data-models.md
  - _bmad-output/planning-artifacts/product-brief-Simmer.md
workflowType: 'research'
lastStep: 6
research_type: 'technical'
research_topic: 'Simmer mobile app — 5 architectural decisions'
research_goals: 'Resolve form factor, auth path, real-time, extraction UX, and offline stance to feed the mobile PRD'
user_name: 'Jamesfrauen'
date: '2026-05-09'
web_research_enabled: true
source_verification: true
---

# Research Report: Simmer Mobile App — 5 Architectural Decisions

**Date:** 2026-05-09
**Author:** Jamesfrauen
**Research Type:** technical

---

## Research Overview

This research resolves the five architectural decisions identified in [docs/architecture.md § Implications for a mobile app](../../../docs/architecture.md#implications-for-a-mobile-app) so the mobile PRD can be written against concrete technical assumptions:

1. **Form factor** — PWA wrap of Next.js / React Native + Expo / fully native
2. **Auth path** — extend `Session` table with Bearer-token alternative, or use cookies
3. **Real-time** — keep 30-second polling, move to SSE, or invest in push notifications
4. **Extraction UX** — keep synchronous `/api/recipes/summarize` or move to async + status polling
5. **Offline support** — explicit v1 stance, given the brief is silent

**Methodology:**
- Anchored every recommendation to the existing Simmer architecture and the product brief's "private family cookbook" framing.
- Verified all framework / platform / hosting claims against current public sources (May 2026).
- Scored each option on solo-developer feasibility, time-to-MVP, mobile-feel quality, and forward optionality.

**Scoring lens (used throughout):**
- Solo-dev feasibility — can one person ship and maintain it?
- Time-to-MVP — weeks of new work before first deploy?
- Mobile-feel — how close to "feels like a real app"?
- Forward optionality — does this decision lock you out of better v2 paths?

---

## Decision 1 — Form factor

### Question
PWA on iOS / Capacitor wrap of Next.js / React Native + Expo / fully native iOS+Android — which?

### Findings

**PWA on iOS (2026):**
- Push notifications **work** on iOS 16.4+ outside the EU, but **only after** the user has manually "Add to Home Screen" — there is no install prompt UX.
- No `beforeinstallprompt` event, no Background Sync, no Periodic Background Sync, no Background Fetch, ever.
- iOS 26 made standalone PWAs the default for home-screen sites — modest improvement.
- ([Apple Developer Forums](https://developer.apple.com/forums/thread/732594), [MagicBell — PWA iOS Limitations 2026](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide), [Mobiloud — PWA on iOS 2026](https://www.mobiloud.com/blog/progressive-web-apps-ios))

**Capacitor + existing Next.js app:**
- Web codebase is primary; Capacitor wraps it as a native shell with bridge access to camera, push, secure storage, etc.
- "One codebase can reuse code almost completely and power your website, PWA, and native apps."
- Native plugins available for FCM/APNs push, secure storage, share sheet — not all polished but workable.
- ([NextNative — Next.js + Capacitor vs Expo](https://nextnative.dev/comparisons/nextjs-vs-expo), [PkgPulse — RN vs Expo vs Capacitor 2026](https://www.pkgpulse.com/guides/react-native-vs-expo-vs-capacitor-cross-platform-mobile-2026))

**Expo (React Native managed):**
- Mobile-first DX; managed build pipeline (EAS); Expo Push for free.
- "Significant hit to code reuse with the web. You can share some business logic, but the entire UI layer is React Native specific."
- Steeper learning curve but the gold-standard mobile feel for a solo developer.
- ([Expo Documentation](https://docs.expo.dev/), [LogRocket — Expo Router Adoption Guide](https://blog.logrocket.com/expo-router-adoption-guide/))

**Fully native iOS+Android:**
- Two codebases, two skill sets, two release pipelines. Ruled out for a solo developer with a working Next.js app.

### Scorecard

| Option | Solo-dev feasibility | Time-to-MVP | Mobile-feel | Forward optionality |
|---|---|---|---|---|
| PWA only | High | 1 week | **Low** (no install prompt, EU push gap, no offline APIs) | Low — capped by iOS Safari |
| **Capacitor + Next.js** | **High** | **2–3 weeks** | Medium (WebView render, native bridges available) | **High** (port hot screens to RN later) |
| Expo (React Native) | Medium | 6–10 weeks | High | High |
| Fully native | Low | 12+ weeks | Highest | High |

### Recommendation: **Capacitor wrap of the existing Next.js app**

**Why:**
- The current web app is already mobile-aware — [src/components/nav-bar.tsx:111–138](../../../src/components/nav-bar.tsx:111) ships a fixed bottom-tab bar at `sm:` and below; [src/hooks/use-wake-lock.ts](../../../src/hooks/use-wake-lock.ts) handles the cooking-mode keep-awake. A Capacitor wrapper inherits all of that for free.
- Solo developer, family-scale audience. The product brief frames Simmer as "see what your sister cooked last night" — not as a delightful-interactions app where animation polish drives retention.
- Capacitor gives you real native push, secure storage, share sheet, camera (for future user photos) — most of the things RN gets you, without throwing away the existing codebase.
- **Forward path:** if a specific screen needs native polish (cooking mode, image-heavy feed scrolling), you can port that screen to React Native using `react-native-web` patterns later. Capacitor doesn't lock you out; rewriting the whole app to Expo *would* lock you out of the web side.

**Rejected:**
- **PWA-only:** the iOS install-prompt UX is too hostile; users won't manually "Add to Home Screen". And the EU push gap is a real product risk if the user base ever grows beyond family.
- **Expo:** correct answer if Simmer were mobile-only or had a delightful-interactions thesis. As a side-quest mobile path for an existing web app with one developer, the 6–10 week mobile-only rebuild is the wrong investment.
- **Fully native:** not a serious option for a solo dev with a shipping web app.

### Implications for the PRD
- "Native app" means a Capacitor build of the existing Next.js codebase.
- Web and mobile share UI, business logic, API client. Mobile-specific code is contained to Capacitor plugins.
- App store presence (iOS App Store + Google Play) is achievable; both stores accept Capacitor apps.

---

## Decision 2 — Auth path

### Question
Extend the existing `Session` table with a Bearer-token alternative, or rely on the existing cookie for the mobile WebView?

### Findings

**Cookie auth in mobile WebViews:**
- Capacitor inherits the WebView's cookie jar, so the existing `auth-token` httpOnly cookie *would* persist across launches in many cases.
- Cookie behavior in WebViews is platform-quirky: iOS WKWebView and Android WebView differ in eviction, third-party cookie handling, and how they treat `SameSite=Lax`.
- React Native (no WebView) needs explicit cookie-jar libraries (`@react-native-cookies/cookies`) — fragile and not the community default.
- ([Locastic — RN cookie-based auth](https://locastic.com/blog/react-native-cookie-based-authentication), [JS in Plain English — RN cookie auth](https://javascript.plainenglish.io/react-native-cookie-authentication-83ef6e84ba70))

**Bearer-token best practices for native:**
- "Cookies excel at browser-based workflows… Bearer tokens provide flexibility especially across different platforms or APIs."
- Store tokens in **iOS Keychain / Android Keystore** via `expo-secure-store` or Capacitor Secure Storage — not AsyncStorage.
- Keep the backend stateless, scalable, and consistent across web and mobile.
- ([React Native Security Docs](https://reactnative.dev/docs/security), [Expo Authentication Guide](https://docs.expo.dev/develop/authentication/), [DEV.to — Cookie vs Bearer](https://dev.to/devtanmay/cookie-auth-vs-bearer-token-in-express-whats-the-difference-and-when-to-use-each-4ieh))

**Existing Simmer auth ([src/lib/auth.ts](../../../src/lib/auth.ts:38)):**
- `Session` table already stores opaque random-UUID tokens with 7-day expiry.
- `getCurrentUser()` reads token from cookie → joins `Session`.
- Adding a Bearer-token path is ~10 lines: read `Authorization: Bearer <token>` header as a fallback when no cookie is present, look up the same `Session` row.

### Scorecard

| Option | Solo-dev feasibility | Time-to-MVP | Mobile-feel | Forward optionality |
|---|---|---|---|---|
| Cookie-only (rely on WebView jar) | High | 0 work | Medium (works in Capacitor; fails for future RN) | **Low** — locks you to WebView-based clients |
| **Bearer + cookie (dual path)** | **High** | **~½ day** | High (Keychain storage, standard pattern) | **High** — works for Capacitor, RN, CLI tools, future integrations |
| OAuth/JWT rewrite | Medium | 1–2 weeks | High | High |

### Recommendation: **Add a Bearer-token path on top of the existing `Session` table**

**Why:**
- Tiny code change with outsized future flexibility. Modify `getCurrentUser()` to read `Authorization: Bearer <token>` if the cookie isn't present; everything else stays the same.
- Capacitor can use either path — Bearer is just cleaner because mobile clients explicitly own their token rather than depending on WebView cookie behavior.
- Stores the same opaque `Session.token` UUIDs you already issue. No new schema, no JWT signing keys, no rotation.
- Forward-compatible with React Native ports, third-party API clients, CLI tools — none of which can consume cookies easily.

**Implementation sketch:**
```ts
// src/lib/auth.ts — getCurrentUser()
const cookieToken = (await cookies()).get(AUTH_COOKIE)?.value;
const headerToken = request?.headers.get("authorization")?.replace(/^Bearer /, "");
const token = cookieToken ?? headerToken;
if (!token) return null;
// existing Session lookup unchanged
```

For mobile login: return the `Session.token` in the response body alongside setting the cookie. The mobile client persists it in Keychain/Keystore via Capacitor Secure Storage.

**Rejected:**
- **Cookie-only:** works for v1 Capacitor but wastes the small refactor cost of Bearer for any future client that isn't a WebView.
- **JWT rewrite:** unnecessary. The existing `Session` table is already secure (opaque random UUIDs, server-side revocation, 7-day expiry). JWTs solve a stateless-scaling problem Simmer doesn't have.

### Implications for the PRD
- Backend change: ~10 lines in [src/lib/auth.ts](../../../src/lib/auth.ts) + return token in login/signup response. Half-day task.
- Mobile change: persist token in secure storage; attach `Authorization` header to every request.
- No CORS change needed if the mobile app loads from the Vercel domain (same-origin). If RN is added later, CORS will need to be opened on `/api/*`.

---

## Decision 3 — Real-time

### Question
Keep the 30-second polling, move to Server-Sent Events, or invest in push notifications?

### Findings

**Polling (current):**
- Implemented in [src/hooks/use-feed-polling.ts](../../../src/hooks/use-feed-polling.ts) with `?since=<ISO>` incremental updates. Simple, robust.
- Battery cost: minimal on web; non-trivial on mobile when app is foregrounded continuously.

**SSE on Vercel (May 2026):**
- Works in App Router with `export const dynamic = "force-dynamic"`.
- **Hobby plan: SSE streams cut off after 10 seconds.** Pro: 60 seconds. Both require EventSource auto-reconnect with event IDs to be functional.
- "Each SSE connection uses a serverless function instance, so you're limited by your function concurrency quota."
- Vercel community guidance: for high-concurrency real-time, use Pusher / Ably / Upstash Redis pub-sub.
- ([Next.js Discussion #48427](https://github.com/vercel/next.js/discussions/48427), [Upstash — SSE LLM Streaming](https://upstash.com/blog/sse-streaming-llm-responses), [Next.js Launchpad — SSE Guide 2026](https://nextjslaunchpad.com/article/nextjs-server-sent-events-real-time-notifications-progress-tracking-live-dashboards))

**Push notifications on Capacitor:**
- Capacitor Push plugin wraps FCM (Android) and APNs (iOS). Requires Apple Developer account ($99/yr) and a server endpoint to send notifications.
- For Expo: Expo Push is free, 600 notifications/sec/project, and abstracts APNs/FCM credentials. Not directly usable from Capacitor without a custom integration.
- OneSignal: 10k subscribers free, more analytics, works with Capacitor.
- ([Expo Push Notifications](https://docs.expo.dev/guides/using-push-notifications-services/), [Courier — RN Push Guide 2026](https://www.courier.com/blog/react-native-push-notifications-fcm-expo-guide), [Knock — Top 7 Push Providers 2026](https://knock.app/blog/evaluating-the-best-push-notifications-providers))

**Family-scale audience reality check:**
- Brief target: 3–5 family members; success metric "users check the feed at least twice per week".
- Feed events per day across a 5-person family: probably <10. Polling at 30s is overkill in absolute terms but cheap in code.

### Scorecard

| Option | Solo-dev feasibility | Time-to-MVP | Mobile-feel | Forward optionality |
|---|---|---|---|---|
| **Keep polling (v1)** | **Maximum** | 0 work | Medium-low (30s lag) | High — replace later |
| SSE on Vercel | Medium | 1 week | Medium (still needs reconnect) | Low — concurrency wall at scale |
| Push (Capacitor + FCM/APNs) | Medium | 2–3 weeks (Apple Dev cert + server) | **High** | High |
| Pusher/Ably (managed real-time) | High | 3–5 days | High | High but pricey at scale |

### Recommendation: **Keep polling for v1; add Capacitor push notifications in v2**

**Why:**
- v1 works today. The polling code is unchanged on mobile (same React, same hook).
- Family-scale traffic doesn't stress the feed, and 30s lag is acceptable for "see what your sister cooked".
- Push is the right v2 because the mobile-native value is "buzz when my mom logs a cook" — polling cannot deliver background notifications, only push can.
- Building push in v2 avoids blocking v1 on Apple Developer enrollment, FCM setup, and server-side notification dispatch.

**v2 push scope when you get there:**
1. Backend: a small `sendPush(userId, payload)` helper that fans out to FCM + APNs via Capacitor Firebase Push or OneSignal.
2. Triggers: subscribe to `FeedEvent` writes, send to friends' devices when an event fires (already a known set: same `getFriendIds()` lookup).
3. Permission UX: ask after first feed view, not on first launch.

**Rejected:**
- **SSE:** the 60-second Pro timeout means you're constantly reconnecting; on cellular this gets ugly. The concurrency cost compounds against function quotas. Push is a better version of "poke the client when something happens".
- **Pusher/Ably for v1:** overkill — Simmer has no presence/typing/cursor features that justify a managed real-time service.

### Implications for the PRD
- Mobile v1 ships with the same polling. No backend change.
- v2 epic: "Push notifications" — separate scope, can land after v1 is in users' hands.
- If push is in v1 anyway, budget 2–3 weeks plus the Apple Developer account.

---

## Decision 4 — Extraction UX

### Question
Keep `POST /api/recipes/summarize` synchronous (current — Gemini call inside the request), or move to an async pattern with a job and status polling?

### Findings

**Vercel function timeouts (May 2026):**
- **Hobby:** 10s default; up to **300s with Fluid Compute**.
- **Pro:** 60s default; up to **800s with Fluid Compute**.
- Synchronous Gemini calls: typically 5–15s; the URL-context fallback (Cloudflare-protected sites + Google Search tool) can hit 30s.
- ([Vercel Functions Limits](https://vercel.com/docs/functions/limitations), [Vercel — Configuring Maximum Duration](https://vercel.com/docs/functions/configuring-functions/duration), [Inngest — How to solve Next.js timeouts](https://www.inngest.com/blog/how-to-solve-nextjs-timeouts))

**Async-job background services:**
- **Inngest:** 50k runs/mo free, runs **inside your Vercel environment** (uses your DB connection strings), zero infra, native Next.js integration.
- **Trigger.dev:** runs jobs **on their servers** (no Vercel timeout limits), better for very long workflows; 1k runs/mo free, then $20/mo.
- ([HashBuilds — Next.js Background Jobs Comparison](https://www.hashbuilds.com/articles/next-js-background-jobs-inngest-vs-trigger-dev-vs-vercel-cron), [NextBuild — Vercel Background Jobs](https://nextbuild.co/blog/background-jobs-vercel-inngest-trigger), [Inngest Vercel Marketplace](https://vercel.com/marketplace/inngest))

**Mobile UX of a 15–30s sync call:**
- Acceptable on wifi with a clear "extracting…" spinner.
- Painful on cellular. Worse: app may be backgrounded mid-extraction; the request can drop and the user's input is lost.

### Scorecard

| Option | Solo-dev feasibility | Time-to-MVP | Mobile-feel | Forward optionality |
|---|---|---|---|---|
| **Sync (current) + Vercel Pro Fluid Compute** | **High** | 0 work | Medium (long spinner; drops on backgrounding) | High — async migration is straightforward later |
| Async with Inngest + status polling | Medium | 4–6 days | **High** (background-tolerant, cancellable) | High |
| Async with Trigger.dev | Medium | 4–6 days | High | High but $$ at scale |

### Recommendation: **Keep sync for v1 (with Vercel Pro Fluid Compute); migrate to async (Inngest) in v2**

**Why:**
- The sync flow already works for the web app. Vercel Pro Fluid Compute (800s ceiling) leaves enormous headroom for the worst-case Gemini path.
- Async is the *right* answer for mobile but it's not the *necessary* answer for v1. Mobile users will see a "Extracting…" spinner that completes 90%+ of the time within 15s.
- Async is the *correct* answer for v2 because:
  - It survives backgrounding — a user can paste a URL, switch to Messages, and come back to a finished recipe.
  - It enables push: "Your recipe is ready" notification, dovetailing with the v2 push work above.
  - Inngest's free tier (50k runs/mo) covers years of family use.

**v2 migration sketch:**
1. `POST /api/recipes/summarize` → returns `{ jobId }` immediately.
2. Inngest function does the JSON-LD + Gemini extraction; writes result to a new `RecipeExtraction` row (or to existing `AISummaryJob`).
3. `GET /api/recipes/extractions/[jobId]` returns status + result.
4. Mobile polls every 1s for ~30s; falls back to push if app is backgrounded.

**Rejected:**
- **Async in v1:** introduces job infrastructure, status polling, error states, and a new failure mode (orphaned jobs) before there's product validation. Defer.
- **Trigger.dev:** good fit for >1-minute jobs. Simmer's extraction is at most 30s; Inngest is the cheaper, native-Vercel choice.

### Implications for the PRD
- v1: sync extraction continues. Confirm the Vercel project is on Pro with Fluid Compute enabled (`maxDuration: 60` or higher in route handler config).
- v2 epic: "Async recipe extraction with background job" — bundle with push notifications since they reinforce each other.

---

## Decision 5 — Offline support

### Question
Should the mobile app work offline? If so, in what mode?

### Findings

**Offline modes from cheapest to most expensive:**
1. **Online-only** — splash → empty state if no network. Zero engineering cost.
2. **Read-only cached library** — last-fetched recipes available offline; new actions require network.
3. **Optimistic writes with retry queue** — cook log, save, etc. queued locally, replayed on reconnect. Conflict-free for this app's data shape.
4. **Full offline-first sync** — local DB with conflict resolution; works fully airplane-mode for days.

**Tooling:**
- **TanStack Query + AsyncStorage persistence** ships option 2 with ~½ day of work. "TanStack Query handles asynchronous server-state fetching and caching" — lightweight, server-state focused, no native dependencies. Doesn't replace a real local DB but covers read-cache cases.
- **WatermelonDB** is the offline-first leader: built-in sync protocol that runs on app foreground / connectivity restore, observables-based reactive UI, scales to 50k+ records. **Requires a development build (no Expo Go) and a custom sync server endpoint** — the sync protocol assumes you write `pullChanges` and `pushChanges` server endpoints.
- **Realm** is now MongoDB-coupled (MongoDB Atlas / Realm Sync); doesn't fit a Postgres backend without significant rework.
- ([Medium — WatermelonDB Offline-First](https://medium.com/@pelumiogundipe905/building-offline-first-react-native-apps-why-watermelondb-is-the-right-choice-96e28e87687f), [Algosoft — Top 11 Local DBs for RN](https://www.algosoft.co/blogs/top-11-local-databases-for-react-native-app-development/), [SourceForge — WatermelonDB Alternatives](https://sourceforge.net/software/product/WatermelonDB/alternatives))

**Brief reality:**
- The product brief says nothing about offline. The implicit "kitchen with bad wifi" use case is real — cooking at the stove with patchy signal is the moment users *most* need offline.
- Offline writes (cook logs while disconnected) are nice but rarely needed: the "I cooked this" event is usually logged after eating, not mid-flame.

### Scorecard

| Option | Solo-dev feasibility | Time-to-MVP | Mobile-feel | Forward optionality |
|---|---|---|---|---|
| Online-only | **Maximum** | 0 work | **Low** (cooking-mode failure) | High |
| **Read-only cached library (TanStack Query persist)** | **High** | **~½ day** | **High** for the cooking case | High |
| Optimistic writes + retry queue | Medium | 3–5 days | Higher | High |
| Full offline-first (WatermelonDB) | Low | 3–5 weeks | Highest | High but heavy |

### Recommendation: **Read-only cached library for v1 (TanStack Query persistence). No offline writes.**

**Why:**
- The killer offline use case is "I'm at the stove, my wifi sucks, I need to see the steps." Read-only cache nails this.
- Engineering cost is ½ day: add `@tanstack/query-async-storage-persister` and configure persistence. The data is already JSON; tag arrays just need parsing once.
- Offline writes are not on the critical path for a private family app where cook logs are typically entered after the meal in a kitchen that has wifi.
- WatermelonDB-grade sync is a 3–5 week investment for a feature few users will exercise. Defer indefinitely.

**v1 scope:**
- Cache the user's library, partner's recipes, saved recipes, and the last 50 feed events on every successful fetch.
- Persist to disk via Capacitor Storage (or AsyncStorage in any future RN port).
- Show a "you're offline — showing cached recipes" banner when network is down.
- All write actions show "you need to be online" until reconnected — no queueing.

**v2 (if user feedback demands it):** add an optimistic-writes retry queue for cook logs only. Do **not** invest in full offline-first sync without strong product evidence.

**Rejected:**
- **Online-only:** abandons the cooking-mode use case, which is precisely where mobile beats web.
- **WatermelonDB / full offline:** scope explosion. Build trust with users on a working v1 first.

### Implications for the PRD
- v1: cache the library + feed for offline reading. No offline writes.
- v2: maybe optimistic cook logs.
- Sync protocol design: not needed for v1. Don't accidentally start designing one.

---

## Synthesis: the Five Decisions in One Table

| # | Decision | v1 choice | v2 plan |
|---|---|---|---|
| 1 | **Form factor** | **Capacitor wrap of existing Next.js app** | Optionally port hot screens to React Native if needed |
| 2 | **Auth** | **Add Bearer-token alternative to existing `Session` table** | No further work needed |
| 3 | **Real-time** | **Keep 30s polling** | Add Capacitor push (FCM + APNs) |
| 4 | **Extraction UX** | **Keep sync (with Vercel Pro Fluid Compute)** | Migrate to Inngest async + status polling |
| 5 | **Offline** | **Read-only cached library (TanStack Query persistence)** | Optional: optimistic cook-log queue |

## Backend changes required for v1

These are the only backend deltas before mobile can ship:

1. **Bearer-token auth path** — ~10 LOC in [src/lib/auth.ts](../../../src/lib/auth.ts) + return `Session.token` in login/signup responses.
2. **Confirm Vercel plan** — Pro with Fluid Compute enabled; set `maxDuration` on `/api/recipes/summarize` to 60+.
3. **(Optional)** Add a `Capacitor Storage`–compatible cache header on read endpoints, or just rely on TanStack Query's client-side caching.

No new tables, no schema migrations, no new services for v1.

## Backend changes deferred to v2

- Push-notification dispatcher (FCM + APNs via Capacitor Firebase Push).
- Inngest job for async extraction; new `extractionJobs` table or extension of `AISummaryJob`.
- Optimistic-writes endpoint contract (idempotency keys for cook log POSTs).

## Risks and open questions for the PRD

| Risk | Mitigation |
|---|---|
| Apple App Store review may push back on Capacitor apps that "look like a website" | Add native-feeling polish: splash screen, native icons, status-bar styling, haptic feedback on key actions. Capacitor handles all of these via plugins. |
| Vercel function timeouts under load (Gemini extraction stalls) | Already mitigated by Pro Fluid Compute. Set `maxDuration: 60` on the summarize route as a belt-and-braces measure. |
| Family-scale traffic doesn't justify any of this | Acceptable. The mobile build is itself the validation experiment — if family doesn't open the app, none of this matters and you reverted nothing irreversible. |
| iOS Apple Developer account requirement ($99/yr) | Required only when shipping to TestFlight / App Store. Develop and test in the iOS Simulator without it. |

## Sources

- [Vercel Functions Limits](https://vercel.com/docs/functions/limitations)
- [Vercel — Configuring Maximum Duration](https://vercel.com/docs/functions/configuring-functions/duration)
- [Vercel Hobby Plan Docs](https://vercel.com/docs/plans/hobby)
- [Inngest — How to solve Next.js timeouts](https://www.inngest.com/blog/how-to-solve-nextjs-timeouts)
- [Inngest Vercel Marketplace](https://vercel.com/marketplace/inngest)
- [HashBuilds — Next.js Background Jobs Comparison](https://www.hashbuilds.com/articles/next-js-background-jobs-inngest-vs-trigger-dev-vs-vercel-cron)
- [NextBuild — Vercel Background Jobs](https://nextbuild.co/blog/background-jobs-vercel-inngest-trigger)
- [Next.js Discussion #48427 — SSE in API Routes](https://github.com/vercel/next.js/discussions/48427)
- [Upstash — SSE LLM Streaming](https://upstash.com/blog/sse-streaming-llm-responses)
- [Next.js Launchpad — SSE Real-Time Guide 2026](https://nextjslaunchpad.com/article/nextjs-server-sent-events-real-time-notifications-progress-tracking-live-dashboards)
- [NextNative — Next.js + Capacitor vs Expo](https://nextnative.dev/comparisons/nextjs-vs-expo)
- [PkgPulse — RN vs Expo vs Capacitor 2026](https://www.pkgpulse.com/guides/react-native-vs-expo-vs-capacitor-cross-platform-mobile-2026)
- [LogRocket — Expo Router Adoption Guide](https://blog.logrocket.com/expo-router-adoption-guide/)
- [MagicBell — PWA iOS Limitations 2026](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)
- [Mobiloud — PWA on iOS 2026](https://www.mobiloud.com/blog/progressive-web-apps-ios)
- [Apple Developer Forums — PWA Push](https://developer.apple.com/forums/thread/732594)
- [Expo Authentication Guide](https://docs.expo.dev/develop/authentication/)
- [React Native Security Docs](https://reactnative.dev/docs/security)
- [Locastic — RN Cookie-based Auth](https://locastic.com/blog/react-native-cookie-based-authentication)
- [DEV.to — Cookie vs Bearer in Express](https://dev.to/devtanmay/cookie-auth-vs-bearer-token-in-express-whats-the-difference-and-when-to-use-each-4ieh)
- [Expo Push Notifications](https://docs.expo.dev/guides/using-push-notifications-services/)
- [Courier — RN Push Guide 2026](https://www.courier.com/blog/react-native-push-notifications-fcm-expo-guide)
- [Knock — Top 7 Push Providers 2026](https://knock.app/blog/evaluating-the-best-push-notifications-providers)
- [Medium — WatermelonDB Offline-First](https://medium.com/@pelumiogundipe905/building-offline-first-react-native-apps-why-watermelondb-is-the-right-choice-96e28e87687f)
- [Algosoft — Top 11 Local DBs for RN](https://www.algosoft.co/blogs/top-11-local-databases-for-react-native-app-development/)
