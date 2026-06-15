## Goal

Fix the catalogue browser modal becoming horizontally scrollable due to a wide Description column, and add a thumbnail column for visual recognition.

## Changes

**`src/lib/catalogue/types.ts`**
- Add `thumbnail?: string` to `CatalogueEntry`.

**`src/lib/catalogue/apexCatalogue.ts`**
- In `loadCatalogue`, extract the thumbnail href from `record.links` (the link with `rel === 'thumbnail'`, also accepting `preview` as a fallback) and set it on the entry.

**`src/components/config/workflows/dialogs/CatalogueBrowserDialog.tsx`**
- Add a `Thumbnail` column (fixed ~64px) as the leftmost column. Render a small 48×48 rounded image with `object-cover`; fallback to a muted placeholder box with the first letter of the name when no thumbnail is available. Use `loading="lazy"` and `onError` to hide broken images.
- Constrain the table layout so the Description column no longer forces horizontal scrolling:
  - Add `table-fixed w-full` to the `Table` (and wrap in a `min-w-0` container) so column widths are respected.
  - Adjust column widths to fit: Thumb 64px, Name 24%, Provider 16%, Type 12%, Description fills the rest.
  - Keep the existing `line-clamp-2` on the description cell and ensure the cell has `min-w-0` plus `break-words` so long unbroken strings (URLs) don't blow out the column.
- Full description remains available via the existing tooltip on hover.

## Out of scope

- No changes to sorting, filtering, mapping logic, or the parent `WorkflowsTab` flow.
- No changes to the review/save dialog.
