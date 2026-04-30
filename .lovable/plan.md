## Add COG performance validation to Layer QA

Extend the existing Layer QA "Performance Warning" category to also flag COG data sources that are likely to be slow to render in the viewer. Mirrors the approach already used for oversized GeoJSON.

### Checks to run (per COG URL)

For any data source where `format === 'cog'` (and the URL is reachable), probe the COG header and emit a `performance-warning` if any of the following are true:

1. **Tile size out of range** — `tileWidth` or `tileLength` < 256 or > 512 (or untiled / strip-based layout)
2. **No overviews** — `overviewCount === 0`
3. **No / inefficient compression** — `compression === 1` (None) or anything outside the efficient set already used by `validateCogCompliance` (`[1, 5, 7, 8, 34712]` minus `1`, i.e. LZW/JPEG/Deflate/JPEG2000 are fine)
4. **Pixel/band-interleaved** — `planarConfiguration === 2` is BSQ (fast); `planarConfiguration === 1` (or undefined) is BIP (slower) → warn

All issues found for a single URL are concatenated into the existing `warning` string (e.g. `"Tile size 1024×1024 too large; no overviews; pixel-interleaved"`).

### Implementation

**1. New helper: `src/utils/cogPerformanceProbe.ts`**

```text
probeCogPerformance(url) → {
  status: 'ok' | 'warning' | 'error',
  message?: string,
  details?: { tileWidth, tileLength, overviewCount, compression, planarConfiguration }
}
```

- Calls existing `fetchCogHeaderMetadata(url)` from `src/utils/cogMetadata.ts` (already cached, time-limited, handles hyperspectral safely).
- Applies the four rules above and builds a human-readable message.
- Errors from the probe are swallowed (return `status: 'ok'`) — reachability is the responsibility of the URL HEAD check that already ran.
- Note on interleave: per existing memory `mem://features/metadata/cog-interleave-detection`, BSQ vs BIP is determined by `PlanarConfiguration` (1 = chunky/BIP, 2 = planar/BSQ). Single-band images (`samplesPerPixel === 1`) skip this check.

**2. Wire into `src/utils/layerValidation.ts`**

In `validateUrl`, after the GeoJSON branch, add a parallel COG branch:

```text
if (directResult.status === 'valid' && format === 'cog') {
  const probe = await probeCogPerformance(url);
  if (probe.status === 'warning') {
    directResult.status = 'performance-warning';
    directResult.warning = probe.message;
  }
}
```

Existing aggregation priority (`error > partial > performance-warning > valid`) and the existing `performance-warning` UI in `CompleteLayersDialog.tsx` (amber pill, inline badge, filter checkbox) and `HomeTab.tsx` Performance Warning stat tile already handle the new warnings — no UI changes needed.

**3. Threshold constants**

Co-locate in the new file:

```text
COG_TILE_MIN = 256
COG_TILE_MAX = 512
COG_EFFICIENT_COMPRESSION = [5, 7, 8, 34712]  // LZW, JPEG, Deflate, JPEG2000
```

### Out of scope

- No changes to the `validateCogCompliance` function used in the COG metadata viewer (it serves a different purpose and uses a wider tile-size tolerance of 128–1024).
- No new stat tile — reuses the existing Performance Warning bucket.
- No changes to the Services page.

### Files touched

- **new** `src/utils/cogPerformanceProbe.ts`
- **edit** `src/utils/layerValidation.ts` (one new branch in `validateUrl`)
