---
title: 'Add notes to want-to-try cook flow'
type: 'feature'
created: '2026-03-31'
status: 'done'
baseline_commit: 'e66889a'
context: []
---

# Add notes to want-to-try cook flow

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** When cooking a want-to-try recipe and deciding whether to promote it to known favorites or discard it, users cannot add a note (e.g. "used less salt", "kids loved it"). The notes textarea exists in the known-delicious inline cook form but is absent from the favorite/discard prompt modal in both `recipe-detail.tsx` and `recipe-library.tsx`. Additionally, `feed-item.tsx` only renders notes for `cook` events, so even `cook_favorite` events with notes would not display them.

**Approach:** Add an optional notes textarea to the favorite/discard prompt modal (the initial "Nice! You cooked it" view). Wire the notes value through to the existing API which already stores notes. Fix feed-item to display notes for `cook_favorite` events too.

## Boundaries & Constraints

**Always:** Reuse existing textarea styling from the inline cook form. Pass notes the same way the known-delicious flow does. Notes are optional — empty notes must not block any action.

**Ask First:** N/A

**Never:** Do not change the API route or database schema. Do not add notes to the discard-confirm sub-view ("Are you sure?" screen).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Favorite with note | User types note, clicks "Yes, Add to Favorites" | Note sent to API, stored in CookLog.notes and FeedEvent metadata | N/A |
| Favorite without note | User leaves note empty, clicks "Yes, Add to Favorites" | Request sent with no notes field (same as today) | N/A |
| Discard after typing note | User types note, clicks "No, Discard" → "Yes, Remove It" | Note is discarded (discard path doesn't store cook logs) | N/A |
| Modal dismissed | User types note, clicks X to close | Note state resets, no API call | N/A |
| Feed displays cook_favorite notes | cook_favorite event has notes in metadata | Notes render as italic quote in feed | N/A |

</frozen-after-approval>

## Code Map

- `src/components/recipe-detail.tsx:497-560` -- Favorite/discard modal for detail page (cookCount === 0 path)
- `src/components/recipe-detail.tsx:132,152-165` -- cookNotes state and handleFavoriteResponse handler
- `src/components/recipe-library.tsx:352-415` -- Favorite prompt modal for library page
- `src/components/recipe-library.tsx:51,92-108` -- favoritePrompt state and handleFavoriteResponse handler
- `src/components/feed-item.tsx:172` -- Notes display condition (currently cook-only)
- `src/app/api/recipes/[id]/cook/route.ts:70-101` -- API already accepts notes (no changes needed)

## Tasks & Acceptance

**Execution:**
- [ ] `src/components/recipe-detail.tsx` -- Add notes textarea to the favorite/discard modal (non-discard-confirm view, between prompt text and buttons). Wire existing `cookNotes` state into `handleFavoriteResponse` so it sends `notes: cookNotes.trim() || undefined`. Reset `cookNotes` when modal closes (X button or after submit).
- [ ] `src/components/recipe-library.tsx` -- Add `favoriteNotes` state. Add matching notes textarea to the favorite prompt modal. Wire into `handleFavoriteResponse` to send `notes: favoriteNotes.trim() || undefined`. Reset `favoriteNotes` when modal closes.
- [ ] `src/components/feed-item.tsx` -- Change notes display condition from `item.eventType === "cook"` to include `cook_favorite` so notes from promoted want-to-try recipes appear in the feed.

**Acceptance Criteria:**
- Given a want-to-try recipe on the detail page, when user clicks "Cooked it!", then the modal includes a notes textarea.
- Given a want-to-try recipe on the library page, when user clicks the cook button, then the modal includes a notes textarea.
- Given a note is entered and user clicks "Yes, Add to Favorites", then the `notes` field is included in the API request body.
- Given the modal is dismissed via X, when reopened, then the notes field is empty.
- Given a cook_favorite feed event has notes, then they render as a quote in the feed.

## Verification

**Commands:**
- `npx tsc --noEmit` -- expected: no type errors
- `npx next build` -- expected: successful build

**Manual checks:**
- Open a want-to-try recipe detail page, click "Cooked it!", verify notes textarea appears in modal
- Enter a note, click "Yes, Add to Favorites", verify note appears in cook history
- Check feed: a cook_favorite event with notes displays the note text

## Suggested Review Order

**Notes UI in modals**

- Entry point: textarea + state wiring in the detail page modal
  [`recipe-detail.tsx:539`](../../src/components/recipe-detail.tsx#L539)

- Handler sends notes to API, resets state after submit
  [`recipe-detail.tsx:157`](../../src/components/recipe-detail.tsx#L157)

- Matching textarea in the library page modal
  [`recipe-library.tsx:396`](../../src/components/recipe-library.tsx#L396)

- Library handler sends notes, resets state on all close paths
  [`recipe-library.tsx:100`](../../src/components/recipe-library.tsx#L100)

**Feed display**

- Expanded condition to render notes for cook_favorite events
  [`feed-item.tsx:172`](../../src/components/feed-item.tsx#L172)

**State cleanup**

- X-close resets cookNotes in detail modal
  [`recipe-detail.tsx:504`](../../src/components/recipe-detail.tsx#L504)

- Discard path resets cookNotes (review patch)
  [`recipe-detail.tsx:177`](../../src/components/recipe-detail.tsx#L177)

- X-close resets favoriteNotes in library modal
  [`recipe-library.tsx:361`](../../src/components/recipe-library.tsx#L361)
