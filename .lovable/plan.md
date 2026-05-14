## Problem

Static GTIF-Austria collections (e.g. `aquifer_eepot_w23_wocc/collection.json`) don't expose `rel:item` links. Instead, they declare:

- collection-level `assets` (e.g. `geothermal`, `thumbnail`)
- one or more `rel:xyz` tile services
- an optional `rel:service` vector endpoint

When the user drills into one of these collections in the STAC browser today, `fetchItems` finds no `rel:item` links and falls back to `<serviceUrl>/collections/{id}/items`, which 404s. The correct experience is to skip the items step and show the collection's own assets — including the xyz tile services — as selectable entries.

## Fix

### 1. `src/components/layers/components/StacBrowser.tsx`

In `enterCatalog`, when the fetched child has `type === 'Collection'`:

- After fetching the child JSON, inspect `data.assets` and `data.links`.
- If the collection has **no `rel:item` links** AND (`data.assets` is non-empty OR there are `rel:xyz` links), bypass `fetchItems` and route straight to the existing `assets` step:
  - Build the asset list from `Object.entries(data.assets || {})`.
  - Append synthetic asset entries for each `rel:xyz` link, keyed by `link.title || basename(link.href)`, with `href = link.href`, `type = link.type` (defaults to `image/png`), `roles: ['tiles']`, and `title = link.title`.
  - `setSelectedItem` to a synthetic item whose `id` is `data.id`, `properties` carry `title`/`description`, and `assets` is the merged map.
  - `setSelectedCollection({ id, title, description, links })`.
  - `setCurrentStep('assets')`.

- Otherwise (has `rel:item` or it's a true API-style collection), keep the current `fetchItems(collection, childUrl)` path.

This reuses the openEO-style branch the file already has at lines 141-160 — same shape, different trigger.

### 2. `src/components/layers/components/StacBrowser.tsx` — initial detection (`detectAndLoadStacResource`)

Apply the same logic when the user pastes a single `collection.json` URL directly: when `data.type === 'Collection'` AND there are no `rel:item` links AND (`assets` or `rel:xyz` exist), short-circuit to the assets step using the same builder. Today this case falls through and ends up trying `fetchCollectionsFromCatalog`, which 404s for static collections.

### 3. `src/utils/stacUtils.ts` — small helper

Add `getXyzTileLinks(links, baseUrl)` (mirroring `getChildLinks`) returning `{ href, title, type }[]` for `rel === 'xyz'`. Keeps the StacBrowser code tidy and matches the existing helper style in this file.

### 4. Asset format detection

`detectAssetFormat` in `stacUtils.ts` doesn't recognize XYZ tile templates (`.../{z}/{y}/{x}.jpeg`). Add a check at the top: if `href` contains `{z}` and `{x}` and `{y}`, return `'xyz'` (or fall through to the existing image/png/jpeg detection — the format string is only used for display + downstream picker, so `'XYZ'` as the display is enough). No schema changes — `'xyz'` is already a known DataSourceFormat in this project.

## Out of scope

- No changes to `stacCapabilities.ts`. The capabilities listing for the parent catalog already correctly enumerates child collections (16 children for GTIF Austria); this fix is purely about what the **browser** does after the user clicks one of them.
- No recursion through `rel:service` vector endpoints — those need a separate path because they're parameterised (`{{feature}}` placeholder) and aren't directly addable as a tile/COG layer.
- No changes to bulk validation, `useBulkServiceValidation`, or diagnostics. The service still validates green.

## Acceptance

- Adding `https://gtif-austria.github.io/public-catalog/GTIF-Austria/catalog.json`, opening the browser, and clicking "Ground Source Heat Pump: Open Systems (Aquifer)" shows an Assets view with `geothermal`, `thumbnail`, plus the four xyz layers (`EOxCloudless 2024`, `Terrain light`, `OSM Background`, `Overlay labels`). No 404 toast.
- Pasting `…/aquifer_eepot_w23_wocc/collection.json` directly into the service URL opens the same Assets view immediately.
- ECOSTRESS `…/eeh-tes-lst/collection.json` (no xyz, no inline assets) continues to behave as today (single-Collection capability + whatever the existing browser does for that case — no regression).
- FAO STAC API and other true STAC API catalogs are unaffected because they always have `rel:item` (or paginated `/items`) and never enter the new branch.
