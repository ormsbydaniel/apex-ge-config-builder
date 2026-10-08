# Asset name badge on the data source summary row

## Goal
On the main layer card, each data source row shows a format badge (e.g. STAC, COG), the display name, and metadata badges. For STAC sources, the configured asset name is currently invisible until you open the editor. Show it as a badge directly on the summary row.

## Current state (verified)
- `src/components/layers/components/DataSourceItem.tsx` renders the summary row: format badge, tooltip display name, then a right-aligned group of badges (band count, bands, date pill, Z, zoom, etc.).
- STAC data sources (`src/types/dataSource.ts`) carry `assets?: string[]` (ordered) and `assetFormats?: Record<string, format>` keyed by asset name. The current editor exposes one asset, but the contract allows several.

## Change
In `DataSourceItem.tsx`, immediately after the format badge, render one small outline badge per configured asset when `dataSource.format?.toLowerCase() === 'stac'` and `assets` is non-empty:

- One badge per asset name (in `assets` order). Today there is normally one; if a future config has several, all are shown.
- Badge text: the asset name only (not the format), matching the form's closed-select behaviour. If an entry exists in `assetFormats` for that name, add it to the badge's tooltip (title/tooltip content: `name — format`) rather than the visible text.
- No badge when the source is not STAC, or a STAC source has no `assets` (older configs may lack it — no badge, no error).
- Styling: `variant="outline"`, `text-xs`, `flex-shrink-0`, consistent with the existing format badge so the row stays visually one family.

No schema, type, or data-model changes — this is read-only presentation of existing fields.

## Tests
Add focused unit tests (extend the existing DataSourceItem test setup or a new render test):
- STAC source with one asset renders the asset-name badge.
- STAC source with multiple assets renders one badge per asset, in order.
- STAC source without `assets` renders no asset badge.
- Non-STAC source renders no asset badge.

## Out of scope
- No changes to the editor, schema, or export ordering.
- No new click behaviour on the badge (can be added later if wanted).
