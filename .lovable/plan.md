## Problem

`https://gtif-austria.github.io/public-catalog/GTIF-Austria/catalog.json` is a **static STAC Catalog** hosted on GitHub Pages. The probe correctly fetches it (200) but then unconditionally appends `/collections?limit=100`, which 404s. The same bug bites any STAC URL that points at:

- a static `catalog.json` (no `/collections` endpoint exists)
- a `collection.json` (it's a single Collection, not a catalog of collections — see the ECOSTRESS `eeh-tes-lst` request in the network log, which 403s on `…collection.json/collections?limit=100`)

The card therefore shows a misleading "404 / endpoint did not return valid JSON" error even though the catalogue itself is perfectly reachable and parseable.

## Fix in `src/utils/stacCapabilities.ts`

After successfully parsing the root JSON, branch on what we actually got before deciding how to enumerate collections:

1. **Single Collection** (`rootJson.type === "Collection"`)
   - Treat the URL itself as the one "layer". Skip the `/collections` fetch entirely.
   - `layers = [{ name: id, title, abstract: description }]`, `totalCount: 1`.

2. **Static Catalog** (`rootJson.type === "Catalog"` AND no STAC API conformance)
   - Detect "API-ness" via `Array.isArray(rootJson.conformsTo) && conformsTo.some(c => /stacspec\.org\/.+\/(core|collections|item-search)/.test(c))`.
   - If not an API, enumerate children from `rootJson.links` where `rel === "child"`. Each child link becomes a layer (`name: link.id || basename(href)`, `title: link.title`, `abstract` left blank).
   - Skip the `/collections` fetch entirely. No 404, no false-failure diagnostic.

3. **STAC API Catalog** (conformsTo includes a STAC API class, e.g. FAO)
   - Keep current behaviour: fetch `/collections?limit=100`.

4. **Fallback** — if a Catalog has neither `conformsTo` API hints nor `rel=child` links, keep the current `/collections` probe but downgrade its 404 to a structured `empty` diagnostic ("Catalogue reachable but no collections discoverable") instead of a hard error.

## Out of scope

- No changes to `serviceCapabilities.ts`, bulk validation, or UI rendering. The existing diagnostic + retry path already surfaces whatever this function returns.
- No recursive child-of-child enumeration for static catalogs — single level is sufficient to populate the card and matches how the existing layers list is consumed.
- No new test file additions beyond optionally extending `serviceDiagnostics.test.ts` if useful; existing manual probe with the GTIF URL is the acceptance check.

## Acceptance

- Adding `https://gtif-austria.github.io/public-catalog/GTIF-Austria/catalog.json` shows green "N collections available" (16+ from the visible `rel=child` links) instead of a 404 error.
- Adding `https://s3.waw4-1.cloudferro.com/ECOSTRESS/stac/collections/eeh-tes-lst/collection.json` shows green "1 collection available" instead of the AccessDenied/404.
- FAO STAC API (`https://data.apps.fao.org/geospatial/search/stac/`) continues to use `/collections?limit=100` and returns its full collection list unchanged.