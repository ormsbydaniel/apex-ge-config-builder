# STAC query editor: support the `/search` endpoint

## Goal

Let a STAC dataset query a collection through the API's `/search` endpoint as an alternative to `/collections/{id}/items`. Some servers (confirmed: EO Data Hub's `sentinel2_ard`) silently ignore the CQL2 `filter` parameter on `/items` but evaluate it correctly on `/search`. Both endpoints return the same STAC `FeatureCollection` shape, so everything downstream (asset discovery, validation, metadata dialog) keeps working.

The saved configuration remains URL-only — no schema, type, or config changes.

## User experience

- When the query editor recognises an items-style query, it shows a **Query method** choice: **Items endpoint** (default, current behaviour) or **Search endpoint**.
- Switching to Search rewrites the address from
  `.../collections/sentinel2_ard/items?bbox=…&filter=…`
  to
  `.../search?collections=sentinel2_ard&bbox=…&filter=…`
  keeping every existing filter (bbox, datetime, limit, property filters) intact. Switching back reverses it.
- A short note beside the choice explains: "Some servers only apply property filters on the search endpoint."
- A pasted `/search?collections=…` URL is recognised directly — the editor opens with Search already selected and all filters editable.
- All existing controls (result limit, date filter, bbox map, property filter badges, Test filter) work identically against either target.
- The row tooltip and 80-character display name already show the full URL, so a search-based dataset is distinguishable on the layer card.

## Technical details

**`src/utils/stacQuery.ts`**
- `isStacSearchUrl(url)`: pathname ends in `/search` and a `collections` parameter is present.
- `itemsUrlToSearchUrl(url)`: strip the `/collections/{id}/items` path, set `collections={id}`, preserve all other query parameters.
- `searchUrlToItemsUrl(url)`: take the first `collections` value, rebuild `.../collections/{id}/items`, drop the `collections` parameter, preserve the rest.
- Extend `StacQueryTarget` with `{ kind: 'search'; searchUrl: string; collectionId: string }`; `inspectStacQueryTarget` recognises `/search` pathnames (and `FeatureCollection` responses carrying a `collections` parameter) without further probing.

**`src/utils/stacMetadata.ts`**
- `getStacCollectionUrl` additionally derives `{origin}/collections/{id}` from the `collections` parameter when the path is `/search`, so the Queryables/Collection tabs and the property-filter builder keep working for search URLs.

**`StacQueryEditor.tsx`**
- Query-method control shown when the target is `items` or `search`; switching calls the converters above via `onChange`.
- `queryable` flag and all badge/dialog wiring treat `search` like `items` (the `itemsUrl` passed to `PropertyFilterDialog` becomes the search URL for search targets).

**Tests** — `src/utils/__tests__/stacQuery.test.ts`:
- Round trips: items → search → items preserves bbox, datetime, limit, filter and unrelated parameters.
- `inspectStacQueryTarget` classifies `/search?collections=x` as a search target without a network call.
- `getStacCollectionUrl` from a search URL.
- Multi-collection `collections=a,b` search URLs: recognised, but switching back to items is disabled (items endpoints serve one collection).

## Out of scope

- POST `/search` bodies and CQL2-JSON.
- Multi-collection editing in the UI (recognised and left as-is).
- Automatic fallback: the editor will not silently rewrite a dataset to `/search`; the user chooses.

## Verification

- Unit tests above (`bunx vitest run src/utils/__tests__/stacQuery.test.ts`), typecheck (`bunx tsgo --noEmit -p tsconfig.app.json`), build log check.
- Preview verification left to the user with the EO Data Hub `sentinel2_ard` layer: switch to Search, set cloud cover ≤ 10, Test filter should return the reduced result set.
