# STAC row display name refinements on layer cards

## Goal

Two refinements to how STAC data source rows on layer cards show their name:

1. **Long single-item names truncated.** A STAC source pointing at a single item
   (`.../collections/{name}/items/{id}`) shows the item ID truncated to the first
   80 characters followed by `…`. The tooltip shows the full, untruncated item ID.
2. **Items list endpoints show the collection name.** A STAC source pointing at
   an items list endpoint (`.../collections/{name}/items`, with or without query
   parameters) displays `{name}/items` instead of the bare `items` it shows today.

## Current behaviour (verified)

- `src/components/layers/components/DataSourceItem.tsx` → `getDisplayName()`
  handles wms/wmts/xyz specially and otherwise calls `extractDisplayName(url, format)`
- `src/utils/urlDisplay.ts` → `extractDisplayName` has no `stac` case, so STAC
  falls to the default branch: last path segment. Result: `items` for list
  endpoints, full item ID (however long) for single items.
- Row tooltip currently shows the full URL (`dataSource.url`) with `break-all`.

## Implementation

### 1. New helper in `src/utils/urlDisplay.ts`

Add `extractStacDisplayName(url: string): string`:

- Parse the URL; split the pathname into segments.
- If the path ends with `/items` (list endpoint): return the preceding
  `collections` segment as `{collectionName}/items`. If no collection segment
  exists (e.g. `/items` at root), fall back to the last segment as today.
- If the path ends with `/items/{id}` (single item): return the item ID; when the
  ID exceeds 80 characters, return `id.slice(0, 80) + '…'`.
- Anything else (collection URLs, query-only endpoints, unparseable URLs): fall
  back to the existing `extractDisplayName` behaviour so nothing regresses.
- Export a `STAC_ITEM_ID_MAX_LENGTH = 80` constant for the cap.

### 2. `DataSourceItem.tsx`

- In `getDisplayName()`, add a STAC branch: when
  `format === 'stac'`, return `extractStacDisplayName(dataSource.url)`.
- Tooltip: for STAC rows, show the **full untruncated display name**
  (`extractStacDisplayName` without truncation — reuse the helper with a
  `truncate` option or export a second untruncated variant) instead of the URL;
  non-STAC rows keep the existing URL tooltip. The row already has a Copy URL
  button, so the URL stays accessible.

### 3. Tests

- New `src/utils/__tests__/urlDisplay.test.ts` covering `extractStacDisplayName`:
  - items list endpoint with and without query parameters → `{name}/items`
  - single item with a long ID (>80 chars) → truncated with `…`
  - single item with a short ID → full ID
  - item URL not under `/collections` → last-segment fallback
  - collection URL and unparseable URL → existing fallback behaviour
- One component test (`DataSourceItem.stacName.test.tsx`): a STAC row with a long
  item ID renders the truncated name and the tooltip carries the full ID; an
  items-list row renders `{name}/items`.

## Out of scope

- No changes to saved configuration, schema, or types — display-only.
- Other `extractDisplayName` consumers (constraints tab, URL display component)
  are untouched; STAC is not used there today.

## Verification

- Focused vitest run on the new/updated tests, `bunx tsgo --noEmit -p tsconfig.app.json`,
  then check `/tmp/observability/build-errors.log`. Visual review left to the user.
