# Layer card display name refinements

## Goal

Refinements to how data source rows on layer cards show their name:

1. **Long single-item STAC names truncated.** A STAC source pointing at a single
   item (`.../collections/{name}/items/{id}`) shows the item ID truncated to the
   first 80 characters followed by `…`. The tooltip shows the full, untruncated
   item ID.
2. **Items list endpoints show the collection name.** A STAC source pointing at
   an items list endpoint (`.../collections/{name}/items`, with or without query
   parameters) displays `{name}/items` instead of the bare `items` it shows today.
3. **Same truncation rule for all formats.** COG, GeoTIFF, vector and default
   filenames (and the XYZ hostname path) get the same 80-character cap with `…`,
   so a very long COG file name no longer makes the row spill over. The tooltip
   shows the full untruncated name in every case.

## Current behaviour (verified)

- `src/components/layers/components/DataSourceItem.tsx` → `getDisplayName()`
  handles wms/wmts/xyz specially and otherwise calls `extractDisplayName(url, format)`
- `src/utils/urlDisplay.ts` → `extractDisplayName` has no `stac` case, so STAC
  falls to the default branch: last path segment. Result: `items` for list
  endpoints, full item ID (however long) for single items.
- Row tooltip currently shows the full URL (`dataSource.url`) with `break-all`.

## Implementation

### 1. Shared truncation helper in `src/utils/urlDisplay.ts`

- Add `truncateDisplayName(name: string, maxLength = 80): string` — returns the
  name unchanged when it fits, otherwise the first 80 characters plus `…`.
- Export a `DISPLAY_NAME_MAX_LENGTH = 80` constant for the cap.

### 2. STAC-aware helper in `src/utils/urlDisplay.ts`

Add `extractStacDisplayName(url: string): string`:

- Parse the URL; split the pathname into segments.
- If the path ends with `/items` (list endpoint): return the preceding
  `collections` segment as `{collectionName}/items`. If no collection segment
  exists (e.g. `/items` at root), fall back to the last segment as today.
- If the path ends with `/items/{id}` (single item): return the item ID through
  `truncateDisplayName` (80-char cap).
- Anything else (collection URLs, query-only endpoints, unparseable URLs): fall
  back to the existing `extractDisplayName` behaviour so nothing regresses.

### 3. General truncation in `extractDisplayName`

- Wrap each returned name — COG/GeoTIFF filename, WMS/WMTS layer or service name,
  vector filename, default filename/hostname, and the catch-all fallback — in
  `truncateDisplayName`, so every format gets the 80-char cap with `…`.
- `truncateUrl` and `getUrlType` are untouched.

### 4. `DataSourceItem.tsx`

- In `getDisplayName()`, add a STAC branch: when `format === 'stac'`, return
  `extractStacDisplayName(dataSource.url)`.
- Tooltip: replace the URL-based tooltip with the **full untruncated display
  name** for all formats (a new `extractFullDisplayName` or a `truncate: false`
  option on the helpers), rendered with `break-all`. Non-truncated rows simply
  show the same text in the tooltip as on the row. The row already has a Copy
  URL button, so the URL stays accessible.

### 5. Tests

- New `src/utils/__tests__/urlDisplay.test.ts` covering:
  - `extractStacDisplayName`: items list endpoint with and without query
    parameters → `{name}/items`; single item with a long ID (>80 chars) →
    truncated with `…`; short ID → full ID; item URL not under `/collections` →
    last-segment fallback; collection URL and unparseable URL → fallback.
  - `truncateDisplayName` / `extractDisplayName`: long COG filename truncated at
    80 chars with `…`; short filenames unchanged; long vector and default-case
    names truncated.

## Out of scope

- No changes to saved configuration, schema, or types — display-only.
- Other `extractDisplayName` consumers (constraints tab, URL display component)
  get the truncation automatically through the shared helper — no code changes
  needed there.

## Verification

- Focused vitest run on the new/updated tests, `bunx tsgo --noEmit -p tsconfig.app.json`,
  then check `/tmp/observability/build-errors.log`. Visual review left to the user.
