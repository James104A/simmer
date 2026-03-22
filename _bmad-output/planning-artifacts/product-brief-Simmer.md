---
title: "Product Brief: Simmer"
status: "complete"
created: "2026-03-21"
updated: "2026-03-22"
inputs:
  - Context/Go-To_Recipes_PRD.pdf
  - go-to-recipes/ (existing codebase)
  - Competitive research (Pepper, Pestle, Paprika, Whisk, Aldente, Cookpad, Morsel)
---

# Product Brief: Simmer

## Executive Summary

Simmer is evolving from a personal recipe aggregator into a shared, living family cookbook — a private social cooking app where the people whose taste you actually trust become your recipe discovery engine.

Today, Simmer already solves the recipe fragmentation problem: paste a URL, let AI extract the recipe, and organize it with tags, ratings, and lists. Users can track what they've cooked, mark favorites, and maintain a "want to try" queue. But cooking is inherently social — you get your best recipes from family group chats, your partner's Instagram saves, your sister's dinner party. Simmer's next phase makes that social layer native: follow family members, see what they cook in a real-time feed, and save their recipes directly to your own "want to try" list with a single tap.

The competitive landscape validates this direction. Recipe managers (Paprika, Pestle, Mela) have zero social features. Social cooking apps (Pepper, Cookpad) are public-first platforms with weak personal libraries. No app combines a strong personal recipe vault with a private, family-scoped social feed. Simmer sits in that white space.

## The Problem

Home cooks discover their best recipes through people they trust — family, close friends, partners. But that discovery happens through scattered, lossy channels: group texts with links that expire, Instagram DMs you can't search, verbal recommendations you forget by Tuesday. There's no place where your family's collective cooking life lives together — where you can see what your sister made last night, save it, and cook it next week.

Existing recipe apps force a false choice: personal organization (Paprika, Pestle) or public social network (Pepper, Cookpad). Families don't want to broadcast grandma's recipes to strangers, but they do want to share them with each other in a way that's persistent, browsable, and actionable.

## The Solution

Simmer adds a social layer to an already-functional personal recipe vault, built around three core additions:

- **Friend connections** — Mutual friend requests (already implemented in the existing app). Accept a request and you see each other's activity. The mutual model fits the trusted-circle use case — you don't follow strangers here.
- **Activity feed** — Three event types populate the feed: cooking a recipe (the primary signal), adding a new recipe, and saving a recipe. Cooking is the strongest signal — it shows what people actually make, complete with their rating. Adding and saving provide lower-weight activity that keeps the feed alive between cook events, which is critical for small networks (a family of 4-5 generates limited cook events per week).
- **Feed-to-list flow** — From the feed, tap to save someone else's recipe to your own "want to try" list. Discovery flows naturally into your personal queue.
- **Invitation flow** — To keep onboarding simple, leverage the existing friend request system: users search by email to find and add family members. This builds on Supabase Auth's existing user lookup and requires no additional infrastructure (no invite codes, no deep links, no SMS integration). A future enhancement could add share-a-recipe-via-link as a more compelling invitation hook.

These features build on existing infrastructure: user accounts, friend requests, recipe bookmarking, and cook logging are already implemented. The work is in refining the social UX, strengthening the feed, adding feed event types, and ensuring the "add" action (cook vs. save) cleanly drives the right social visibility.

## What Makes This Different

- **Private-first social graph** — Simmer is for your inner circle, not the internet. No public profiles, no follower counts as status. The social layer serves discovery within mutual friend connections.
- **Cooking is the headline signal** — Cook events are the primary feed content, shown with the user's rating. Adding and saving recipes provide supporting activity that keeps the feed alive without diluting the core "what are people actually making?" signal.
- **Personal vault stays personal** — Your saved recipes, your "want to try" list, your ratings — these remain your private library. The social feed is an overlay, not a replacement.
- **AI-powered recipe ingestion** — Paste any URL, get a structured recipe via Gemini extraction. This lowers the friction to add recipes from any source, which feeds the social loop.
- **Trusted ratings over algorithmic recommendations** — A recipe rated 9/10 by your sister carries more weight than a million anonymous five-star reviews. Family ratings create a recommendation signal that public platforms fundamentally cannot replicate.

## Who This Serves

**Primary:** Home cooks within a family or close friend group who already share recipes informally. They cook regularly, collect recipes from multiple sources (Instagram, food blogs, family), and want to see what the people they trust are actually making. Starting with the builder's own family as the founding user group.

**Secondary (future):** Friend circles who cook together, dinner clubs, roommates coordinating meals.

## Success Criteria

- **Social adoption:** 3+ family members actively using Simmer within the first month
- **Feed engagement:** Users check the feed at least twice per week
- **Cross-pollination:** At least 30% of "want to try" additions come from the social feed (vs. direct URL adds)
- **Cook signal usage:** Users mark recipes as "cooked" consistently, keeping the feed alive with real activity

## Scope

**In for this phase:**
- Mutual friend connections (leveraging existing friend request system)
- Activity feed with three event types: cooked (with rating), added recipe, saved recipe
- Recipe images pulled from source URL during AI extraction (displayed on cards and in feed)
- Save-from-feed to personal "want to try" list
- Numeric ratings on recipes when marking as cooked, visible in feed
- Invitation via email search (simple, no additional infrastructure)
- Existing features preserved: personal library, tags, search/filter, favorites, AI extraction

**Out of scope:**
- Comments or reactions on feed items
- Public profiles or discoverability beyond direct friend connections
- Meal planning or grocery list features
- User-uploaded photos (recipe images come from source URLs only)
- Push notifications
- Recipe recommendations or algorithmic feed ordering
- Share-via-link invitation flow (future enhancement)

## Vision

If Simmer works for families, it becomes the place where your household's food culture lives — a shared, evolving cookbook that captures what you actually cook, not just what you bookmark. Over time, this could expand to friend groups, dinner clubs, and communities that share food traditions. The social graph data (who cooks what, who saves from whom) creates a foundation for genuinely useful recipe recommendations — surfacing recipes you'd love based on the taste of people you trust, not trending content from strangers.
