---
stepsCompleted: ["step-01-init", "step-02-discovery", "step-02b-vision", "step-02c-executive-summary", "step-03-success", "step-04-journeys", "step-05-domain-skipped", "step-06-innovation-skipped", "step-07-project-type", "step-08-scoping", "step-09-functional", "step-10-nonfunctional", "step-11-polish", "step-12-complete"]
status: complete
completedAt: "2026-03-21"
inputDocuments:
  - "Context/Go-To_Recipes_PRD.pdf"
  - "_bmad-output/planning-artifacts/product-brief-Simmer.md"
documentCounts:
  briefs: 1
  research: 0
  brainstorming: 0
  projectDocs: 1
  projectContext: 0
workflowType: 'prd'
classification:
  projectType: web_app
  domain: general
  complexity: low-medium
  projectContext: brownfield
notes:
  - "Partner/shared vault feature - option to add a single 'partner' who shares your recipe vault for couples use case"
---

# Product Requirements Document - Simmer

**Author:** Jamesfrauen
**Date:** 2026-03-21

## Executive Summary

Simmer is a personal recipe vault evolving into a private social cooking app for families and couples. Built on an existing Next.js + Supabase + Gemini stack, Simmer already handles AI-powered recipe extraction from URLs, personal library management with tags/filters/search, ratings, cook tracking, and favorites. This phase adds the social layer: mutual friend connections, a real-time activity feed, and a shared partner vault for couples who co-own a single recipe collection.

The core use case is the weekly "what should we cook?" decision. Families and couples browse a library of recipes they know they love — rated by people whose taste they trust — and discover new ones through a feed of what their inner circle is actually cooking. Simmer sits in the white space between personal recipe managers (Paprika, Pestle, Mela) that have zero social features and public cooking platforms (Pepper, Cookpad) with weak personal libraries. No existing app combines a strong personal/shared recipe vault with a private, family-scoped social feed.

### What Makes This Special

- **Private-first social graph.** Simmer is for your inner circle, not the internet. Mutual friend connections only — no public profiles, no follower counts, no strangers.
- **Partner vault.** Couples co-own a single recipe collection, making the "what are we eating?" conversation a shared browsing experience rather than separate libraries.
- **Cooking as the headline signal.** The activity feed is anchored by cook events with ratings. A recipe your sister rated 9/10 and cooked three times is a stronger recommendation than any algorithm.
- **AI-powered ingestion.** Paste any URL, get a structured recipe via Gemini extraction. Low friction to add recipes feeds the social loop.
- **Personal vault stays personal.** Your saved recipes, "want to try" list, and ratings remain your private space. The social feed is an overlay, not a replacement.

## Project Classification

- **Project Type:** Web application (Next.js, responsive/mobile-first)
- **Domain:** Consumer/lifestyle — personal recipe management with private social layer
- **Complexity:** Low-medium — standard web patterns with social feed, cross-user visibility, and partner vault privacy boundaries
- **Project Context:** Brownfield — building on an existing, functional recipe vault with user accounts, friend requests, bookmarking, and cook logging already implemented

## Success Criteria

### User Success

- **Activation:** A new user adds their first recipe and connects with at least one friend or partner within the first session.
- **Retention:** Users open Simmer 3+ times per week, driven by the weekly "what should we cook?" browse.
- **Referral:** Users invite at least one family member within the first two weeks — the app is only valuable with your people in it.
- **"Aha" moment:** Seeing a friend's cook event with a rating in the feed and saving it to "want to try" — the moment Simmer feels different from a solo recipe app.

### Business Success

- **Acquisition:** 3+ family members onboarded within the first month of a founding user joining.
- **Activation:** 80%+ of onboarded users add at least 5 recipes in their first two weeks.
- **Revenue signal (future):** Not applicable for MVP — success is measured by engagement within the founding family group.
- **Partner vault adoption:** Couples who link as partners both actively add or cook recipes within the first two weeks.

### Technical Success

- **Reliability above all:** Zero data loss, zero broken states. If the app fails once for a family member, they won't come back. Target 99.9% uptime for core flows (add recipe, browse library, view feed).
- **Performance:** Library page loads in under 2 seconds with 200+ recipes. Feed loads in under 1 second. Filters apply instantly (client-side).
- **AI extraction:** 80%+ of URL-pasted recipes produce usable structured data without manual editing.
- **Seamless social rollout:** New social features (feed, partner vault) must not degrade the existing personal vault experience.

### Measurable Outcomes

| Metric | Target | Timeframe |
|--------|--------|-----------|
| Family members active per founding user | 3+ | First month |
| Weekly app opens per user | 3+ | Ongoing |
| "Want to try" additions from social feed | 30%+ of total | After first month |
| Cook events logged per active user | 2+ per week | Ongoing |
| Partner vault link-up rate | 80%+ of couples | First two weeks |
| AI extraction acceptance rate | 80%+ | Ongoing |

## Product Scope

See [Project Scoping & Phased Development](#project-scoping--phased-development) for detailed MVP feature set with rationale, phased roadmap, and risk mitigation strategy. Summary:

- **MVP (Phase 1):** Partner vault, activity feed (3 event types), save-from-feed, friend connections via email search. All existing features preserved.
- **Growth (Phase 2):** Share-via-link invitations, push notifications, comments/reactions.
- **Vision (Phase 3):** Recipe recommendations, expanded social circles, meal planning, family cookbook export.

## User Journeys

### Journey 1: The Founding Cook — Building the Shared Vault

**Persona:** Jamie, 30s, cooks 4-5 nights a week. Has 50+ recipes scattered across browser bookmarks, Instagram saves, and screenshot folders. Already uses Simmer as a solo recipe vault.

**Opening Scene:** Jamie's been using Simmer solo for a month — 40 recipes saved, a dozen rated, a handful marked as go-tos. But every Sunday the same conversation happens: "What should we make this week?" Jamie's partner Alex scrolls Instagram while Jamie flips through Simmer. They're solving the same problem in two different places.

**Rising Action:** Jamie sees the new partner vault feature. Sends Alex a partner invite from within Simmer. Alex accepts, and suddenly they're looking at the same library — Jamie's 40 recipes are now *their* 40 recipes. Alex starts adding a few of their own favorites. They browse together on Sunday afternoon, tapping "want to try" on three recipes for the week.

**Climax:** Wednesday night, Jamie cooks a Thai basil chicken from the shared vault, marks it "cooked" with a 9/10 rating. Jamie's sister Sarah — connected as a friend — sees it in her feed the next morning and saves it to her own "want to try" list.

**Resolution:** The weekly meal decision now starts inside Simmer. Jamie and Alex browse the shared vault together. Recipes flow in from family through the feed. The group text still exists, but the recipe links land in Simmer now, not lost in a scroll of messages.

**Capabilities revealed:** Partner invite flow, vault merging/sharing, cook logging with rating, feed event generation, friend visibility of activity.

---

### Journey 2: The Invited Family Member — Joining the Circle

**Persona:** Sarah, Jamie's sister, late 20s. Solid home cook, gets most recipes from food blogs and TikTok. Has never used a recipe manager — her system is screenshots and a notes app.

**Opening Scene:** Sarah gets a text from Jamie: "We're using this app Simmer to save recipes, you should join so we can see what each other's cooking." Sarah is skeptical — she's downloaded cooking apps before and abandoned them within a week.

**Rising Action:** Sarah signs up, searches Jamie's email, sends a friend request. It's accepted immediately. She opens the feed and sees Jamie cooked that Thai basil chicken with a 9/10. She taps through, reads the AI-generated summary, and saves it to her "want to try" list. Then she pastes a URL from a food blog she's been meaning to try — Simmer extracts the recipe in seconds. That felt easy.

**Climax:** Over the next two weeks, Sarah adds 8 recipes. She cooks one on a Thursday, marks it "cooked" with a 7/10. Jamie sees it in the feed the next day and asks about it over text. The app is generating real conversations.

**Resolution:** Sarah checks Simmer a few times a week — not to add recipes (that happens when she finds one), but to see what Jamie and Alex are cooking. The feed is sparse but every item is relevant because it's only people she trusts. She stops screenshotting recipes.

**Capabilities revealed:** Email-based friend search, friend request flow, feed consumption, save-from-feed, URL paste + AI extraction for new user, cook event visibility across connections.

---

### Journey 3: The Partner Browser — Co-owning Without Contributing Equally

**Persona:** Alex, Jamie's partner, early 30s. Enjoys cooking but doesn't hunt for recipes. Happy to cook whatever looks good from the shared vault. Adds a recipe maybe once a month.

**Opening Scene:** Alex accepts the partner invite from Jamie. Suddenly Simmer has 40 recipes that feel relevant because Jamie curated them. Alex doesn't need to build a library from scratch — it's already there.

**Rising Action:** Alex browses the shared vault on Monday, filtering by "Weeknight" and "< 30 min." Three options surface. Alex picks one, cooks it Tuesday, and marks it "cooked" with an 8/10. That activity shows up in the family feed.

**Climax:** Alex sees Sarah's cook event in the feed — a new pasta recipe rated 7/10. Alex saves it. On Sunday, when Jamie asks "what should we make this week?", Alex pulls up Simmer and says "Sarah made this pasta thing, want to try it?" The app is doing the discovery work that used to require group text archaeology.

**Resolution:** Alex opens Simmer 2-3 times a week. Rarely adds recipes but actively browses, cooks from the vault, and rates. Alex's cook events keep the feed alive for the rest of the family. The partner vault means Alex never felt the cold-start problem — there was always something to cook.

**Capabilities revealed:** Partner vault eliminates cold start, filter/browse shared library, low-friction cook logging, feed as passive discovery, asymmetric contribution model (one partner curates, both benefit).

---

### Journey 4: The Feed Lurker — Discovery Without Contribution

**Persona:** Mom (Linda), 60s. Cooks regularly but has her own recipes memorized. Joined Simmer because Jamie and Sarah asked her to. Not going to paste URLs or learn a new system deeply.

**Opening Scene:** Linda signs up because her kids asked. She connects with Jamie and Sarah. She has zero recipes in her library and isn't going to add any right away.

**Rising Action:** Linda opens the app and sees the feed — Jamie cooked Thai basil chicken (9/10), Sarah tried a new pasta (7/10). She taps through to read the recipes. She saves one to "want to try." She doesn't add her own recipes, but she's seeing what her kids are eating and that's enough to keep her opening the app.

**Climax:** One Sunday, Linda makes her famous pot roast. Jamie texts "Mom you should add that to Simmer." Linda tries pasting a URL but this recipe isn't from a website — it's hers. She uses the native recipe entry to type in the ingredients and steps. It takes 5 minutes but now it's in the family's orbit.

**Resolution:** Linda checks the feed once or twice a week. She's added 3 native recipes over two months — all family staples. Her cook events are rare but highly valued by the family. The app works for her because the feed requires zero effort and native recipe entry exists for the occasional contribution.

**Capabilities revealed:** Feed-only engagement path, save-from-feed without own library, native recipe entry for non-URL recipes, low-contribution user still generates value through occasional cook events, empty-state experience that's still useful via feed.

---

### Journey Requirements Summary

| Capability | Journeys |
|-----------|----------|
| Partner invite + shared vault | 1, 3 |
| Friend search by email + friend requests | 1, 2, 4 |
| Activity feed (cook/add/save events) | 1, 2, 3, 4 |
| Save-from-feed to "want to try" | 2, 3, 4 |
| Cook logging with rating | 1, 2, 3 |
| AI URL extraction | 1, 2 |
| Native recipe entry | 4 |
| Filter/search shared library | 3 |
| Cold-start experience (empty library + feed) | 2, 4 |
| Asymmetric contribution (browse-heavy users) | 3, 4 |
| Feed event generation from all activity types | 1, 2, 3 |
| Existing library preserved through social rollout | 1 |

## Web App Specific Requirements

### Project-Type Overview

Simmer is a Next.js App Router application with SPA-like interaction patterns and selective server-side rendering. The app is authenticated-only (no public pages beyond a potential future marketing landing page). The primary interaction modes are library browsing/filtering (client-heavy), feed consumption (real-time updates), and recipe entry (form-based).

### Technical Architecture Considerations

**Rendering Strategy:**
- Client-side rendering for library browsing, filtering, and search (performance-critical, interactive)
- Server components for initial data fetching (recipe detail, feed load)
- Optimistic UI updates for cook logging, ratings, and save actions — user sees immediate confirmation without waiting for server round-trip

**Real-Time Requirements:**
- Activity feed updates via Supabase Realtime (subscriptions on feed events table)
- Does not need sub-second latency — eventual consistency within a few seconds is acceptable for a family-sized network
- Cook/save/add actions must show immediate local confirmation (optimistic update), with server sync following
- No presence indicators or typing signals needed

**Responsive Design:**
- Mobile-first layout — primary use case is phone in the kitchen or on the couch
- Tablet and desktop supported but secondary
- Touch-optimized interactions: tap to save, tap to cook, swipe-friendly card browsing
- Filter drawer collapses to modal/bottom sheet on mobile

**Browser Support:**
- Modern evergreen browsers only: latest 2 versions of Chrome, Safari, Firefox, Edge
- No IE11 or legacy browser support
- Safari on iOS is critical (kitchen/mobile use case)

### Implementation Considerations

Performance targets are defined in [Non-Functional Requirements > Performance](#performance).

- **Supabase as backend:** Auth, database (Postgres), Realtime subscriptions, and Row Level Security for partner vault and friend visibility boundaries
- **Partner vault data isolation:** RLS policies must ensure both partners see shared recipes while non-partners cannot. This is the most security-sensitive data boundary in the app.
- **Feed query efficiency:** Feed is scoped to mutual friends only. Query should be indexed on friend relationship + event timestamp. With small networks (< 20 friends), performance is not a concern but the query pattern should be correct from the start.
- **Offline:** Not required. App assumes connectivity.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Experience MVP — the minimum social layer that moves the "what should we cook?" conversation from group texts into Simmer. The existing recipe vault is already functional; this phase adds the connective tissue between users.

**Resource Requirements:** Solo developer (builder). Existing Next.js + Supabase + Gemini stack. No new infrastructure needed — Supabase Realtime covers the feed, RLS covers the partner vault data boundaries.

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
- Journey 1 (Founding Cook) — full support
- Journey 2 (Invited Family Member) — full support
- Journey 3 (Partner Browser) — full support
- Journey 4 (Feed Lurker) — full support

**Must-Have Capabilities:**

| Capability | Rationale |
|-----------|-----------|
| Partner vault (invite, link, shared collection) | Core differentiator; solves the couples use case from day one |
| Activity feed (cooked, added, saved events) | All three types needed to keep feed alive with small networks |
| Cook event with rating visible in feed | The headline social signal |
| Save-from-feed to "want to try" list | Completes the discovery-to-action loop |
| Friend search by email + mutual friend requests | Only onboarding path; no invite codes or deep links |
| Recipe images from source URL | Cards and feed need visual content to feel alive |
| Optimistic UI for cook/save actions | Immediate feedback is non-negotiable for trust |
| All existing features preserved | Library, tags, search/filter, favorites, AI extraction, native recipes, cook tracking, ratings |

**Explicitly NOT in MVP:**
- Push notifications
- Comments or reactions on feed items
- User-uploaded photos
- Recipe recommendations
- Share-via-link invitations
- Public profiles or discoverability

### Post-MVP Features

**Phase 2 (Growth):**
- Share-via-link invitation flow — more compelling than "search my email," gives new users a recipe to land on
- Push notifications for friend activity — re-engagement for users who don't check the feed organically
- Comments or light reactions on feed items — adds social texture without requiring full conversation features

**Phase 3 (Expansion):**
- Recipe recommendations based on social graph signals (most-cooked by people you trust)
- User-uploaded photos for native recipes
- Expanded social circles: friend groups, dinner clubs
- Meal planning and grocery list integration
- "Family cookbook" export

### Risk Mitigation Strategy

**Technical Risks:**
- *Partner vault RLS complexity:* Two users co-owning data in Supabase requires careful RLS policy design. Mitigate by designing and testing RLS policies before building UI. This is the single hardest technical problem in the MVP.
- *Feed query performance:* Low risk at family scale (< 20 friends), but index on (friend_id, created_at) from the start to avoid future migration.
- *Existing features regression:* Social rollout must not break the solo vault experience. Mitigate with manual testing of core flows (add recipe, browse, filter, search) before and after social feature deployment.

**Market Risks:**
- *Social cold-start:* Non-issue — the builder's family is the founding user group, and the partner vault provides immediate value for a couple even with zero friends connected.
- *Adoption friction:* Email-based friend search is the only onboarding path. If family members don't sign up, the social layer has no content. Mitigate by personally onboarding the founding family group. Phase 2 adds share-via-link for easier invitations.

**Resource Risks:**
- *Solo developer:* Scope is intentionally tight. If time is constrained, the minimum shippable unit is: partner vault + feed with cook events only (drop added/saved events temporarily). But all three event types are the target.

## Functional Requirements

### Recipe Management (Existing — Preserved)

- FR1: Users can create a linked recipe by pasting a URL
- FR2: Users can create a native recipe with ingredients, steps, and notes entered directly
- FR3: Users can edit any recipe they own (or co-own via partner vault)
- FR4: Users can delete any recipe they own (or co-own via partner vault)
- FR5: Users can add personal notes to any recipe in their library
- FR6: Users can tag recipes with season, cuisine, dish type, "good for," dietary, and main ingredient categories
- FR7: Users can browse their recipe library as scannable cards in grid or list layout
- FR8: Users can search recipes by full-text across title, notes, ingredients, and AI-generated summaries
- FR9: Users can filter recipes by any combination of tag categories with AND logic across categories and OR logic within
- FR10: Users can sort recipes by recently added, most cooked, highest rated, or prep time

### Go-To Signals (Existing — Preserved)

- FR11: Users can rate a recipe on a numeric scale
- FR12: Users can mark a recipe as "cooked" to increment cook count and record the date
- FR13: Users can toggle a recipe as a favorite/pinned
- FR14: Users can maintain a "want to try" list of saved recipes
- FR15: System surfaces go-to signals (rating, cook count, favorite status) on recipe cards and detail views

### AI Recipe Extraction (Existing — Preserved)

- FR16: System extracts structured recipe data (description, highlights, ingredients, image) from a pasted URL using Gemini
- FR17: Users can review and edit AI-generated fields before saving a linked recipe
- FR18: System provides a manual text-paste fallback when URL fetch fails or page is paywalled
- FR19: System caches AI-generated summaries and provides a regenerate option
- FR20: System extracts and stores a recipe image from the source URL when available

### Partner Vault (New)

- FR21: Users can send a partner invite to one other user
- FR22: Users can accept or decline a partner invite
- FR23: Partners co-own a single shared recipe collection — both can view, add, edit, and delete all recipes in the vault
- FR24: System merges both partners' existing recipes into the shared vault upon linking
- FR25: Users can unlink from a partner (with clear handling of recipe ownership)

### Social Connections (New — Building on Existing Friend Requests)

- FR26: Users can search for other users by email address
- FR27: Users can send a friend request to another user
- FR28: Users can accept or decline incoming friend requests
- FR29: Users can view their list of current friends
- FR30: Users can remove a friend connection

### Activity Feed (New)

- FR31: Users can view a chronological feed of activity from their mutual friends
- FR32: System generates a feed event when a user marks a recipe as cooked (including their rating)
- FR33: System generates a feed event when a user adds a new recipe
- FR34: System generates a feed event when a user saves a recipe to their "want to try" list
- FR35: Users can tap a feed item to view the full recipe detail
- FR36: Feed updates in near-real-time without requiring manual page refresh
- FR37: Users can save a recipe from the feed directly to their own "want to try" list

### Account & Authentication (Existing — Preserved)

- FR38: Users can sign up and sign in via Supabase Auth
- FR39: Users can manage their profile (display name, email)

## Non-Functional Requirements

### Performance

- Library page with 200+ recipes loads in under 2 seconds
- Activity feed loads in under 1 second
- Filter and search results appear instantly (client-side processing)
- Cook/save/favorite actions provide immediate visual feedback via optimistic UI updates
- AI recipe extraction completes within 10 seconds, with async loading state shown to user
- First meaningful paint under 3 seconds on a 4G mobile connection
- Feed real-time updates arrive within 5 seconds of the originating action

### Security & Data Privacy

- All data encrypted in transit (HTTPS) and at rest (Supabase default encryption)
- Partner vault enforced via Supabase Row Level Security — users can only access recipes owned by themselves or their linked partner
- Activity feed queries scoped to mutual friends only via RLS policies — no data leakage across non-connected users
- Friend requests require mutual acceptance before any data visibility is granted
- Authentication handled entirely by Supabase Auth; no custom credential storage
- API keys (Gemini) stored server-side only; never exposed to client

### Reliability

- 99.9% uptime for core flows: add recipe, browse library, view feed, mark as cooked
- Zero data loss on any user action — all writes confirmed before showing success state
- Graceful degradation: if Supabase Realtime is temporarily unavailable, feed falls back to refresh-on-load (no errors shown)
- AI extraction failures handled gracefully with manual fallback — never blocks recipe creation
- Optimistic UI updates must reconcile correctly if server rejects the action (revert state, show error)

### Integration

- Gemini API for recipe URL extraction — must handle rate limits, timeouts, and model availability gracefully
- Supabase Realtime for feed subscriptions — must reconnect automatically on connection drop
- URL fetching for recipe extraction must handle paywalls, bot-blocking, and malformed HTML without crashing
