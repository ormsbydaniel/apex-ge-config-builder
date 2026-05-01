## Goal

When the user picks a layer from the "Copy from layer" dropdown and the editor already has categories, show a preview of the donor's categories as badges inside the confirmation dialog (`CategoryCopyLogic`), so the user can see what they're about to add or replace before deciding.

If there are no existing categories, the copy is applied directly without a confirmation step today — no preview is needed in that path.

## Proposed layout (inside the existing `Add categories` AlertDialog)

```text
┌─ Add categories ───────────────────────────────────────────┐
│ You have 5 existing categories.                            │
│ How would you like to add the 8 categories from "Land Use"?│
│                                                            │
│ Preview from "Land Use" (8)                                │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ ● Forest  ● Water  ● Urban (3)  ● Crops  ● Bare ...   │ │
│ │ ● Wetland  ● Snow  ● Grassland                         │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│              [Cancel] [Add to existing (13)] [Replace (8)] │
└────────────────────────────────────────────────────────────┘
```

Layout details:
- Small label above the badge area: `Preview from "<Layer>" (<n>)`, using muted-foreground.
- Badges reuse the exact visual style already established by `CategoryPreview` (color dot + label, `(value)` shown when the donor `hasValues` is true), so it's instantly recognisable.
- Container: `flex flex-wrap gap-1`, capped height (e.g. `max-h-32 overflow-y-auto`) with subtle `bg-muted/30 rounded-md p-2 border` so it reads as a distinct preview panel and won't blow up the dialog if the donor has many categories.
- Sits between the description and the footer buttons; footer buttons remain unchanged.

## Implementation

1. **Extract the badge rendering** out of `CategoryPreview.tsx` into a small reusable piece so both the main editor preview and the confirmation dialog render identical badges. Two reasonable shapes:
   - Add an internal `CategoryBadgeList` (or simply export a `CategoryBadges` subcomponent) that takes `{ categories, useValues }` and renders the `flex flex-wrap` badge grid.
   - `CategoryPreview` keeps its current outer styling and delegates to `CategoryBadgeList`.
   This avoids duplicating the badge markup and keeps any future styling tweaks in one place (consistent with the project's "cohesion over premature splitting" guideline).

2. **Update `CategoryCopyLogic.tsx`** to render the donor preview:
   - Use `pendingCopyData.categories` and `pendingCopyData.hasValues` (already on the prop).
   - Render `CategoryBadgeList` inside the dialog body, with the small heading described above.
   - Guard against the empty case (e.g. CSV import with 0 rows) — skip the preview block if `incoming === 0`.

3. **No schema, type, or context changes** — `pendingCopyData` already carries everything needed (`name`, `categories`, `hasValues`).

## Files touched

- `src/components/form/CategoryPreview.tsx` — extract `CategoryBadgeList` (or export the badges subcomponent).
- `src/components/form/CategoryCopyLogic.tsx` — render the donor preview block between description and footer.

## Out of scope

- Changing the immediate-copy path (when there are no existing categories) — no confirmation dialog appears there, so no preview is shown. Happy to add an inline preview there too if you'd like, but keeping the current "just do it" flow respects the existing behaviour.
- Changing copy semantics (append/replace logic) or the dropdown itself.
