---
title: "Simmer — API Contracts"
generated: 2026-05-09
source: src/app/api/**
---

# API Contracts

All endpoints are Next.js App Router route handlers under `src/app/api/`. Request/response bodies are JSON.

## Conventions

- **Auth**: every endpoint except signup/login/logout calls `getCurrentUser()` ([src/lib/auth.ts:38](../src/lib/auth.ts:38)) which reads the `auth-token` httpOnly cookie. Missing or expired → `401 Unauthorized`.
- **Cookies set on auth**: `auth-token` (httpOnly, secure in prod, 7-day expiry) and `auth-status` ("1", non-httpOnly so client JS can detect logged-in state).
- **Error shape**: `{ "error": "<message>" }` with appropriate status code.
- **Tag arrays in recipe payloads**: server stringifies on POST and deserializes raw on GET (clients must `JSON.parse(recipe.cuisineTypes)`).
- **No request validation library** — bodies are read with `await request.json()` and used directly. Mobile clients should send well-formed bodies; bad input may surface as 500.

---

## Authentication

### POST /api/auth/signup
Create a new account.
- **Body**: `{ email, name, password }` (password must be ≥ 8 chars)
- **Returns 201**: `{ success: true, user: { id, name, email } }` + sets cookies
- **Errors**: 400 (missing fields, short password), 409 (email taken)

### POST /api/auth/login
- **Body**: `{ email, password }`
- **Returns 200**: `{ success: true, user: { id, name, email } }` + sets cookies
- **Errors**: 400 (missing), 401 (invalid credentials)

### POST /api/auth/logout
Clears the session and both cookies. Always returns `{ success: true }`.

---

## Recipes

### GET /api/recipes
List the **current user's own** recipes (does not include partner's recipes — for the merged library see [src/app/page.tsx:25–32](../src/app/page.tsx:25)).
- **Returns 200**: `Recipe[]` ordered by `[isFavorite desc, createdAt desc]`

### POST /api/recipes
Create a recipe (linked or native). Also writes `FeedEvent { eventType: "add_recipe" }`.
- **Body**: any subset of Recipe fields. Tag arrays are sent as JS arrays; server `JSON.stringify`s them.
- **Returns 201**: the created Recipe

### GET /api/recipes/[id]
Fetch a single recipe with access control:
- Owner → full record
- Partner → full record (including `personalNotes`)
- Accepted friend → record minus `personalNotes`
- Has saved this recipe → record minus `personalNotes`
- Otherwise → 404

### PATCH /api/recipes/[id]
Update fields on a recipe. **Owner or partner** only.
- **Body**: partial Recipe (sent as-is to Prisma — *see warning below*)
- **Returns 200**: updated Recipe

> ⚠️ The PATCH body is passed straight to `prisma.recipe.update({ data: body })` ([src/app/api/recipes/[id]/route.ts:71–74](../src/app/api/recipes/[id]/route.ts:71)). The server does not re-stringify tag arrays here, so callers updating tags must either send JSON-encoded strings or this needs hardening.

### DELETE /api/recipes/[id]
Delete a recipe. **Owner or partner** only. Returns `{ success: true }`.

### POST /api/recipes/summarize
Extract recipe data from a URL via a fallback chain:
1. Server-side `fetch` + JSON-LD parsing ([src/lib/extract.ts](../src/lib/extract.ts))
2. If structured data is incomplete and `GEMINI_API_KEY` is set → Gemini with raw page text
3. If server fetch failed entirely (Cloudflare) → Gemini with `urlContext`, then `googleSearch` ([src/lib/ai.ts:130–161](../src/lib/ai.ts:130))

- **Body**: `{ url }`
- **Returns 200**: `{ title, descriptionShort, highlights, ingredients, steps, prepTimeMinutes, cookTimeMinutes, servings, imageUrl, sourceUrl, fetchedAt, method }` where `method` is one of `structured | structured+ai | ai | ai-url-context`
- **Errors**: 400 (no URL), 422 (extraction failed — `{ error, fallback: true }`)

### GET /api/recipes/[id]/cook
List cook history for the current user on a given recipe. Returns `CookLog[]` ordered by `cookedAt desc`.

### POST /api/recipes/[id]/cook
Two modes:
- **Normal cook** — body `{ cookedAt?, notes?, favorite? }`. Increments `cookCount`, sets `lastCookedAt`, optionally flips `isFavorite=true`, writes a `cook` or `cook_favorite` FeedEvent.
- **Discard** — body `{ discard: true }`. Records a `cook_discard` FeedEvent with a snapshot, then either deletes the recipe (if owner) or removes the SavedRecipe (if not).

### DELETE /api/recipes/[id]/cook
Body `{ logId }`. Deletes one CookLog entry (own only); decrements `Recipe.cookCount` and recomputes `lastCookedAt`.

---

## Saved recipes (bookmarks → "want to try")

### GET /api/saved-recipes
Returns `SavedRecipe[]` with `recipe.user` populated.

### POST /api/saved-recipes
- **Body**: `{ recipeId }`
- Idempotent (uses upsert on `[userId, recipeId]` unique).
- Cannot save own recipe — 400.
- Writes `FeedEvent { eventType: "save_recipe" }`.

### DELETE /api/saved-recipes
- **Body**: `{ recipeId }` — deletes the bookmark.

---

## Feed

### GET /api/feed
- **Query**: optional `?since=<ISO timestamp>` — returns only events newer than this. Used by the polling hook for incremental updates.
- **Logic**: events from `[currentUser, ...acceptedFriends]`, max 50, newest first.
- **Returns 200**: `FeedEvent[]` with `recipe` (subset of fields) and `user` (id, name) joined.

### POST /api/feed
- **Body**: `{ recipeId, eventType }`
- Manually create a feed event. Note: `cook` / `add_recipe` / `save_recipe` events are **already** auto-created by their respective endpoints. This route exists but is not used by the current UI.

---

## Friends

### GET /api/friends
Returns the User objects (id, name, email) for accepted friends — derived from FriendRequest rows.

### POST /api/friends
Send a friend request by email.
- **Body**: `{ email }`
- **Returns 201**: the FriendRequest
- **Errors**: 400 (no email / self), 404 (no such user), 409 (already friends or pending). Re-sending after a `declined` updates the row in place ([src/app/api/friends/route.ts:80–87](../src/app/api/friends/route.ts:80)).

### GET /api/friends/requests
Pending **incoming** requests for the current user (where they're the receiver). Includes sender info.

### PATCH /api/friends/requests/[id]
Accept or decline a pending request — receiver only.
- **Body**: `{ action: "accept" | "decline" }`

### GET /api/friends/search
- **Query**: `q` (≥ 2 chars) — case-insensitive `contains` match on name or email.
- **Returns**: up to 20 Users (id, name, email), excluding self.

---

## Partner

A Partnership is the **shared-vault** relationship — distinct from friendship. Max one per user.

### GET /api/partner
Returns the active partnership info (`{ id, partner, createdAt }`) or `null` if none.

### POST /api/partner
- **Body**: `{ email }`
- **Errors**: 400 (already have a partner / self / target already partnered), 404 (no such user).

### DELETE /api/partner
Unlinks the active partnership (pending or accepted). Deletes the row.

### GET /api/partner/requests
Pending incoming partner invites (where current user is receiver).

### PATCH /api/partner/requests
- **Body**: `{ partnershipId, action: "accept" | "decline" }`
- Decline deletes the row; accept flips status to `accepted`.

---

## Onboarding

### POST /api/onboarding
Sets `User.hasSeenOnboarding = true`. No body. Used to dismiss the welcome modal.

---

## Endpoint summary table

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/signup` | — | Create account |
| POST | `/api/auth/login` | — | Sign in |
| POST | `/api/auth/logout` | — | Sign out (clears cookies) |
| GET | `/api/recipes` | ✓ | Own recipes |
| POST | `/api/recipes` | ✓ | Create recipe |
| GET | `/api/recipes/[id]` | partial | View recipe (visibility rules) |
| PATCH | `/api/recipes/[id]` | ✓ | Edit (owner or partner) |
| DELETE | `/api/recipes/[id]` | ✓ | Delete (owner or partner) |
| POST | `/api/recipes/summarize` | ✓ | URL → structured recipe via AI |
| GET | `/api/recipes/[id]/cook` | ✓ | Cook history |
| POST | `/api/recipes/[id]/cook` | ✓ | Log a cook (or discard) |
| DELETE | `/api/recipes/[id]/cook` | ✓ | Remove a cook log |
| GET | `/api/saved-recipes` | ✓ | List bookmarks |
| POST | `/api/saved-recipes` | ✓ | Bookmark a recipe |
| DELETE | `/api/saved-recipes` | ✓ | Remove bookmark |
| GET | `/api/feed` | ✓ | Activity feed |
| POST | `/api/feed` | ✓ | Manually emit feed event (unused) |
| GET | `/api/friends` | ✓ | List accepted friends |
| POST | `/api/friends` | ✓ | Send request by email |
| GET | `/api/friends/requests` | ✓ | Incoming pending requests |
| PATCH | `/api/friends/requests/[id]` | ✓ | Accept/decline |
| GET | `/api/friends/search` | ✓ | Search users |
| GET | `/api/partner` | ✓ | Current partnership |
| POST | `/api/partner` | ✓ | Send partner invite |
| DELETE | `/api/partner` | ✓ | Unlink |
| GET | `/api/partner/requests` | ✓ | Pending partner invites |
| PATCH | `/api/partner/requests` | ✓ | Accept/decline partner invite |
| POST | `/api/onboarding` | ✓ | Mark onboarding complete |

---

## Mobile considerations

- **No Bearer-token auth path exists today.** A mobile client would either need to (a) accept and persist the `auth-token` cookie via a cookie jar, or (b) require the backend to add a Bearer token alternative on top of the existing session table. Option (b) is small — `Session.token` already works fine as a Bearer.
- **No CORS configuration** in [next.config.ts](../next.config.ts) — APIs accept requests from same-origin only by default. A separate mobile app on a different domain (or no origin) will need CORS allowances or a proxy.
- **No rate limiting / abuse protection** is in place. AI extraction in particular (`POST /api/recipes/summarize`) hits Gemini per request.
- **No pagination** on most list endpoints. Feed is hard-capped at 50; friends/recipes are unbounded.
- **Polling is client-driven** with `?since=<ISO>`. Push notifications would be a meaningful UX upgrade for mobile, but that's a backend addition.
