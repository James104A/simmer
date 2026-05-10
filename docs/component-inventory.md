---
title: "Simmer — Component Inventory"
generated: 2026-05-09
source: src/components/, src/hooks/
---

# Component Inventory

All components live flat in `src/components/`. Styling is Tailwind CSS v4 with a custom palette (`accent-amber`, `foreground-muted`, `background-elevated`, etc.) and a Playfair Display display font for headings.

## Components by category

### Layout / shell
| Component | File | Notes |
|---|---|---|
| `NavBar` | [src/components/nav-bar.tsx](../src/components/nav-bar.tsx) | Top bar (desktop) + mobile bottom-tab nav. Pending-friend-request badge. |
| `LogoutButton` | [src/components/logout-button.tsx](../src/components/logout-button.tsx) | POSTs `/api/auth/logout`, redirects to `/login`. |
| `OnboardingModal` | [src/components/onboarding-modal.tsx](../src/components/onboarding-modal.tsx) | First-login welcome; dismissed via `POST /api/onboarding`. |

### Recipe — library views
| Component | File | Notes |
|---|---|---|
| `RecipeLibrary` | [src/components/recipe-library.tsx](../src/components/recipe-library.tsx) | Home page. Tabs: "Known Delicious" (`cookCount > 0`) and "Want to Try" (uncooked own + saved-from-friends). Search, filters, sort, grid/list toggle. Owns the cook-modal flow (favorite prompt, discard confirm, notes). |
| `RecipeCard` | [src/components/recipe-card.tsx](../src/components/recipe-card.tsx) | Card surface used in the library grid. |
| `SearchBar` | [src/components/search-bar.tsx](../src/components/search-bar.tsx) | Free-text search over recipe titles/notes. |
| `FilterPanel` | [src/components/filter-panel.tsx](../src/components/filter-panel.tsx) | Multi-select filters across all tag categories + time range. |

### Recipe — detail / form
| Component | File | Notes |
|---|---|---|
| `RecipeDetail` | [src/components/recipe-detail.tsx](../src/components/recipe-detail.tsx) | Full recipe view. Cook-mode toggle (uses `useWakeLock`). Parses all JSON-string fields client-side. |
| `RecipeForm` | [src/components/recipe-form.tsx](../src/components/recipe-form.tsx) | Create/edit form. URL-summarize integration. Tag selectors backed by [src/lib/constants.ts](../src/lib/constants.ts). |

### Feed
| Component | File | Notes |
|---|---|---|
| `FeedList` | [src/components/feed-list.tsx](../src/components/feed-list.tsx) | List + new-items banner. Backed by `useFeedPolling`. |
| `FeedItem` | [src/components/feed-item.tsx](../src/components/feed-item.tsx) | One feed entry — handles all five event types (`cook`, `cook_favorite`, `cook_discard`, `add_recipe`, `save_recipe`). |

### Friends / partner
| Component | File | Notes |
|---|---|---|
| `FriendRequests` | [src/components/friend-requests.tsx](../src/components/friend-requests.tsx) | Pending incoming requests with accept/decline. |
| `FriendSearch` | [src/components/friend-search.tsx](../src/components/friend-search.tsx) | Type-to-search users; send request from result. |
| `PartnerSection` | [src/components/partner-section.tsx](../src/components/partner-section.tsx) | Manage active partnership: invite, accept/decline, unlink. |

---

## Hooks

| Hook | File | Notes |
|---|---|---|
| `useFeedPolling` | [src/hooks/use-feed-polling.ts](../src/hooks/use-feed-polling.ts) | 30-second polling loop. Stages new items behind a "N new updates" banner instead of inserting them silently. |
| `useWakeLock` | [src/hooks/use-wake-lock.ts](../src/hooks/use-wake-lock.ts) | Wraps Screen Wake Lock API. Re-acquires on tab visibility change. Used by RecipeDetail's "cook mode". |

---

## Patterns

- **Server Components by default.** Pages (`src/app/**/page.tsx`) are async server components that read from Prisma directly and pass props down. Only components needing state, effects, or browser APIs are marked `"use client"`.
- **No state library.** Local component state via `useState` is the only client store. Cross-page data is refetched on navigation (server-rendered).
- **No design-system package.** Styling is ad-hoc Tailwind utilities; common patterns (rounded amber buttons, muted secondary text, backdrop-blurred surfaces) are duplicated rather than extracted.
- **Generated Prisma types** are imported directly into client components (e.g. `import { Recipe } from "@/generated/prisma/client"`), which is convenient but couples UI to ORM types.

## Implications for mobile

- The web UI is **already mobile-aware** — `NavBar` ships a fixed bottom-tab bar on `sm:` breakpoints and below. That layout decision validates the navigation IA for a native app.
- **Cook mode + wake lock** is a mobile-first feature borrowed from web; on iOS/Android, a native equivalent is `keepAwake`/`activitystarter` APIs.
- Reusable design tokens (colors, typography) live as Tailwind CSS variables in `globals.css`; porting to mobile means re-deriving a token set rather than reusing components.
