# Support the STAC "query" filter style (Element 84 Earth Search)

## Finding
Earth Search v1 does not support CQL2 `filter` at all — its conformance list only advertises the older STAC **Query extension**. Tested on the Bristol Sentinel-2 search:

| Request | Items | Max cloud cover |
|---|---|---|
| No filter | 200 | 100 |
| `filter=eo:cloud_cover < 5` (CQL2 text, GET) | 200 | 100 (ignored) |
| CQL2 JSON via POST | 200 | 100 (ignored) |
| `query={"eo:cloud_cover":{"lt":5}}` (GET) | 35 | 4.79 (works) |

## What to build
1. Read the catalogue's `conformsTo` list and pick the filter style: CQL2 `filter` when advertised, otherwise the Query extension `query=` parameter.
2. Write property rules in the chosen style (operators map to `eq, neq, lt, lte, gt, gte, in, startsWith/contains`), still saved only in the URL.
3. Parse existing `query=` URLs back into rule badges; show a small badge "Query extension" vs "CQL2".
4. Test button: when neither style is advertised, warn that filters may be ignored.
5. Docs: short note in the STAC browser page and Tutorial 12-2.

## Technical details
- Encoding/parsing in `src/utils/stacQuery.ts`; conformance lookup cached per catalogue root; comparison in `stacFilterComparison.ts` uses the same encoder.
- The Geospatial Explorer must pass `query=` through unchanged — it already uses the URL as-is.
- Unit tests for round trips and conformance selection.
