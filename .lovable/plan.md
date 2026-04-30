# WMS / WMTS Performance Checks

Unlike COGs (whose performance is intrinsic to the file format) WMS/WMTS performance is mostly a property of the **server response and the layer's capabilities entry**. There are no file headers to inspect, but `GetCapabilities` already gives us most of what's useful. We can also do one lightweight tile/image probe.

All checks run only after reachability passes, and only surface as the amber **Performance Warning** status (never mask a real error), matching the existing COG/GeoJSON pattern.

## Proposed checks

### Shared (WMS + WMTS)
1. **Slow GetCapabilities response** — flag if the document took `> 5 s` to fetch, or is `> 2 MB`. A bloated capabilities doc means slow first paint for every viewer load. We already capture `durationMs` and `bytes` in `fetchServiceCapabilitiesWithMetrics`; just need to surface them.
2. **Missing CRS / TileMatrixSet for Web Mercator (EPSG:3857)** — if the layer doesn't advertise `EPSG:3857` (WMS) or a `GoogleMapsCompatible` / `EPSG:3857` TileMatrixSet (WMTS), the map will reproject on the fly (WMS) or fail to tile cleanly (WMTS). Warn.
3. **No bounding box advertised** — without a bbox the viewer can't cull tile requests outside the data extent, leading to wasted requests. Warn.

### WMS-specific
4. **No tiling hint / huge GetMap** — do one probe `GetMap` request at a small size (e.g. 256×256) within the advertised bbox and measure response time + bytes. Flag if `> 3 s` or `> 1 MB` for a single 256-pixel tile (indicates the server isn't tile-cached and will be painful in a slippy map).
5. **No `image/png` or `image/jpeg` in advertised formats** — forces fallback to slower/heavier formats. Warn.
6. **Layer is a group node only (no `<Name>`)** — already filtered out as a layer, but if the user references it by title we can warn it isn't directly renderable.

### WMTS-specific
7. **Only non-PNG/JPEG `Format` advertised** — same reasoning as WMS.
8. **TileMatrixSet has very deep zoom but no `MinTileMatrix`/`MaxTileMatrix` `TileMatrixSetLimits`** — without limits the client may request tiles outside the data extent at high zoom. Warn.
9. **REST template missing** — if neither `ResourceURL` nor a KVP endpoint is exposed, OpenLayers has to fall back to KVP which is slower. Warn if no `ResourceURL` of type `tile`.

### Optional / phase 2 (skip if you'd rather keep scope tight)
- **CORS check on a probe tile** — fetch one tile with `mode: 'cors'`; if it fails, the layer will only work with a tile proxy. (This is more of a correctness check than performance, but very valuable.)
- **HTTPS mixed-content check** — warn if service URL is `http://` while the app is served over `https://`.

## Recommended initial scope

To keep parity with the COG probe (one new utility, surfaced via the existing amber pill), I'd implement **checks 1, 2, 3, 5, 7, 9** in the first pass — all pure capabilities-document inspection, no extra network calls beyond the GetCapabilities we already make. Check 4 (probe GetMap) is the highest-value addition but requires a second network round-trip per layer; worth doing but flagged separately so you can opt in.

## Technical sketch

### New file: `src/utils/serviceCapabilitiesPerformanceProbe.ts`
```ts
export interface ServicePerfProbeResult {
  status: 'ok' | 'warning';
  message?: string;
  issues: string[];
}

export function probeServiceCapabilitiesPerformance(
  format: 'wms' | 'wmts',
  layerName: string | undefined,
  capabilities: ServiceCapabilities,
  metrics: { durationMs?: number; bytes?: number },
  rawXml?: Document, // optional, for format/ResourceURL inspection
): ServicePerfProbeResult
```
Returns a concatenated message like `"Slow capabilities (6.2s); EPSG:3857 not advertised; no PNG/JPEG output"`.

### Edit: `src/utils/layerValidation.ts`
- Inside `validateServiceUrl`, after the current "valid" path, parse the XML once (we already have `xmlDoc`), call the probe, and if it returns a warning set `result.status = 'performance-warning'` and `result.warning = probe.message`. No extra network calls.
- Reuse `fetchServiceCapabilitiesWithMetrics` so we get `durationMs` / `bytes` instead of re-fetching.

### No UI changes needed
The existing amber **Performance Warning** pills in `CompleteLayersDialog.tsx` and the `HomeTab` "Performance Warning" tile already key off `status === 'performance-warning'` and read `warning`.

## Files

- `src/utils/serviceCapabilitiesPerformanceProbe.ts` — new
- `src/utils/layerValidation.ts` — edit `validateServiceUrl` to call the probe and reuse the metrics-aware capabilities fetch

## Open questions

1. Do you want the **probe `GetMap` tile request** (check 4) included in the first pass, or capabilities-only for now?
2. Are the thresholds reasonable? Suggested defaults: capabilities `> 5 s` or `> 2 MB`; probe tile `> 3 s` or `> 1 MB`.
3. Include the **CORS / HTTPS mixed-content** checks (phase 2) now, or defer?
