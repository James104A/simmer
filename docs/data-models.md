---
title: "Simmer — Data Models"
generated: 2026-05-09
source: prisma/schema.prisma
---

# Data Models

PostgreSQL schema managed via Prisma 7. The Prisma client is generated to `src/generated/prisma/` (non-default location) and connects through `@prisma/adapter-pg`. All foreign keys cascade on user deletion unless noted.

> **Mobile-relevant note:** array-typed fields (`highlights`, `ingredients`, `steps`, all `*Tags` fields) are stored as **JSON-encoded strings**, not native Postgres arrays. Clients must `JSON.parse` on read and `JSON.stringify` on write.

## Entity overview

| Entity | Purpose | Key relationships |
|---|---|---|
| `User` | Account record | owns recipes, has friends/partners, generates feed events |
| `Session` | Auth token storage | belongs to User; queried by token cookie |
| `Recipe` | Recipe (linked or native) | belongs to User; has cook logs, AI jobs, save references, feed events |
| `AISummaryJob` | Audit trail for AI extraction attempts | belongs to Recipe |
| `CookLog` | One row per "I cooked this" event | belongs to User + Recipe |
| `SavedRecipe` | Bookmark from friend's recipe → "want to try" list | belongs to User + Recipe |
| `FriendRequest` | Pending/accepted/declined friendship | sender + receiver Users |
| `Partnership` | Shared-vault relationship (1:1 max) | sender + receiver Users |
| `FeedEvent` | Activity stream entry | belongs to User; optional Recipe (nulls on cook_discard cleanup) |

---

## User

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String
  passwordHash String
  hasSeenOnboarding Boolean @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  // ...relationships
}
```

- Email is unique and the lookup key for login + friend/partner invites.
- `passwordHash` is bcrypt (12 rounds) — see [src/lib/auth.ts](../src/lib/auth.ts).
- `hasSeenOnboarding` gates the welcome modal on first login.

## Session

```prisma
model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  @@index([token])
}
```

- Token is `crypto.randomUUID()`, 7-day expiry.
- Session validation reads token from `auth-token` httpOnly cookie, joins on User.
- Expired sessions are deleted lazily on lookup ([src/lib/auth.ts:48–52](../src/lib/auth.ts:48)).

## Recipe

The largest model. Two recipe modes — `linked` (URL + AI-extracted) and `native` (user-typed). Most fields apply to both modes; `url`/`imageUrl`/`descriptionShort` are linked-only inputs.

```prisma
model Recipe {
  id        String   @id @default(cuid())
  userId    String
  title     String
  recipeType String  // "linked" | "native"

  // Linked-recipe fields
  url              String?
  imageUrl         String?    // hero image extracted from source
  descriptionShort String?
  highlights       String?    // JSON array of strings
  ingredients      String?    // JSON array of strings
  steps            String?    // JSON array of strings

  // Tagging — all stored as JSON-encoded string arrays
  personalNotes      String?
  seasonTags         String?
  dishTypes          String?
  cuisineTypes       String?
  goodForTags        String?
  dietaryTags        String?
  mainIngredientTags String?

  // Time
  prepTimeMinutes  Int?
  cookTimeMinutes  Int?
  totalTimeMinutes Int?
  servings         String?    // string because some sources say "4-6"

  // Go-to signals
  rating       Int?            // 1–10 (per product brief) — set when marking cooked
  isFavorite   Boolean  @default(false)
  cookCount    Int      @default(0)
  lastCookedAt DateTime?
}
```

Allowed values for tag arrays come from [src/lib/constants.ts](../src/lib/constants.ts):
- `seasonTags`: Spring, Summer, Fall, Winter, Any
- `dishTypes`: Appetizer, Main, Side, Dessert, Snack, Breakfast/Brunch, Soup/Stew, Salad, Drink/Cocktail
- `cuisineTypes`: Italian, Mexican, Indian, Thai, American, Mediterranean, Japanese, Chinese, French, Korean, Middle Eastern, Greek
- `goodForTags`: Weeknight, Dinner Party, Meal Prep, Date Night, Kid-Friendly, Crowd/Potluck, Healthy-ish, Comfort Food
- `dietaryTags`: Vegetarian, Vegan, Gluten-Free, Dairy-Free, Nut-Free, Low-Carb, Paleo, Whole30
- `mainIngredientTags`: Chicken, Beef, Pork, Fish, Shrimp, Tofu, Lamb, Turkey, Eggs

Indexed on `userId`. Sorted by `[isFavorite desc, createdAt desc]` in the default library view.

## AISummaryJob

Append-only log of Gemini extraction attempts. Status field tracks `pending | processing | completed | failed`. `rawExtract` keeps the raw model output; `errorMessage` captures failures. Currently observational — useful for debugging AI extraction quality but not user-facing.

## CookLog

```prisma
model CookLog {
  id        String   @id @default(cuid())
  recipeId  String
  userId    String
  cookedAt  DateTime @default(now())
  notes     String?
  @@index([userId, cookedAt])
}
```

One row per cook event. Side effects when written ([src/app/api/recipes/[id]/cook/route.ts](../src/app/api/recipes/[id]/cook/route.ts)):
1. Increments `Recipe.cookCount` and updates `lastCookedAt`.
2. Optionally sets `isFavorite=true` on the recipe.
3. Creates a `FeedEvent` of type `cook` or `cook_favorite`.

## SavedRecipe

```prisma
model SavedRecipe {
  id        String   @id @default(cuid())
  userId    String
  recipeId  String
  @@unique([userId, recipeId])
  @@index([userId])
}
```

Bookmark from a friend's recipe → user's "want to try" list. POST also writes a `FeedEvent` of type `save_recipe`. Users cannot save their own recipes (server enforces).

## FriendRequest

```prisma
model FriendRequest {
  id         String   @id @default(cuid())
  senderId   String
  receiverId String
  status     String   // "pending" | "accepted" | "declined"
  @@unique([senderId, receiverId])
  @@index([receiverId, status])
}
```

A single row covers the relationship in both states. To list friends, the API queries `status="accepted" AND (senderId=me OR receiverId=me)` ([src/lib/friends.ts](../src/lib/friends.ts)). Declined requests can be reused — re-sending updates the existing row in place.

## Partnership

```prisma
model Partnership {
  id         String   @id @default(cuid())
  senderId   String
  receiverId String
  status     String   // "pending" | "accepted"
  @@unique([senderId, receiverId])
}
```

Distinct from friendship: a Partnership creates a **shared recipe vault**. Partners see each other's recipes in the home library, can edit each other's recipes, and see each other's `personalNotes`. A user may have at most **one active partnership** (pending or accepted). Enforced server-side via `hasPartnership()` ([src/lib/partner.ts](../src/lib/partner.ts)).

## FeedEvent

```prisma
model FeedEvent {
  id        String   @id @default(cuid())
  userId    String
  eventType String   // "cook" | "cook_favorite" | "cook_discard" | "add_recipe" | "save_recipe"
  recipeId  String?  // nullable — preserved when recipe is deleted via cook_discard
  metadata  String?  // JSON: { notes, cookedAt, favorite } for cook events
  @@index([userId, createdAt])
  @@index([createdAt])
}
```

The activity-stream backbone. Polled every 30s by the web client ([src/hooks/use-feed-polling.ts](../src/hooks/use-feed-polling.ts)) using `?since=<ISO>`. Recipe is `SetNull` on delete so `cook_discard` events survive even after the recipe is gone — `metadata` stores a snapshot (title, image, cuisine, dish type) for rendering.

Events are returned for `[currentUser, ...friendIds]` (partners are included only via the friend list — see [src/app/api/feed/route.ts:38–39](../src/app/api/feed/route.ts:38)).

---

## Migration history

Migrations under `prisma/migrations/`:

| Date | Migration | What changed |
|---|---|---|
| 2026-03-02 | `init` | Initial schema |
| 2026-03-02 | `add_recipe_image_url` | Hero image URL on Recipe |
| 2026-03-02 | `add_cook_log` | CookLog model |
| 2026-03-21 | `multi_user_social` | User/Session/FriendRequest/SavedRecipe — pivot to social app |
| 2026-03-22 | `add_feed_events` | FeedEvent model |
| 2026-03-22 | `add_partnership` | Partnership model |
| 2026-03-22 | `feed_event_optional_recipe` | Recipe FK on FeedEvent → SetNull |
| 2026-04-01 | `add_onboarding_flag` | `User.hasSeenOnboarding` |

The schema has stabilized since the social/partnership pivot in late March 2026.

---

## Implications for mobile

- **Tag arrays as JSON strings** is a wire-format quirk worth abstracting in any mobile data layer rather than leaking into UI code.
- **Cookie-based sessions** don't translate cleanly to native mobile — see [development-guide.md](./development-guide.md) and architecture notes on auth approaches.
- **Feed polling is client-driven**; a mobile app would benefit from push notifications or WebSockets, neither of which exists yet.
- **Recipe access control** (own / partner / friend / saved-by-me) is implemented at the API layer in [src/app/api/recipes/[id]/route.ts:25–45](../src/app/api/recipes/[id]/route.ts:25). Mobile must hit those same endpoints rather than re-implementing the rules.
