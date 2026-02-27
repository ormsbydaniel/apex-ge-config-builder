

## Implementation Plan: Two-Phase COG Metadata with Band Selector

### Task 1: Split `fetchCogMetadata` into header and band statistics functions

**File: `src/utils/cogMetadata.ts`**

**1a. Update `CogMetadata` interface** — add fields:
- `ifdCountCapped?: boolean` — true if IFD enumeration hit the time limit
- `statisticsBand?: number` — which band the statistics refer to
- `multiBand?: boolean` — true if `samplesPerPixel > 1`
- `statisticsNote?: string` — e.g. "IFD enumeration capped" or "Statistics timed out"

**1b. New `fetchCogHeaderMetadata(url: string): Promise<CogMetadata>`** — extracts everything from the current `fetchCogMetadata` except the `computeStatisticsFromOverview` call:
- Opens `fromUrl(url)`, reads image 0 header tags, geo keys, EPSG, bounding box, GDAL_METADATA min/max, nodata, file size (HEAD request), embedded colormap, COG validation.
- Replaces `getImageCount()` with a time-limited IFD walk: iterate `tiff.getImage(i)` in a try/catch loop with a 5-second wall-clock timeout. Record count found and set `ifdCountCapped` flag if timeout hit.
- Sets `multiBand = samplesPerPixel > 1`.
- Returns header-only `CogMetadata`.

**1c. New `fetchCogBandStatistics(url: string, bandIndex: number, noDataValue?: number): Promise<BandStatistics>`** — new return type `BandStatistics = { min?: number; max?: number; dataNature: string; uniqueValues?: number[]; sampleCount: number }`:
- Opens `fromUrl(url)`.
- Iterates IFDs capped at 20 to find best overview (target ~2M pixels).
- Pixel guard: if smallest overview > 4M pixels, return `{ dataNature: 'unknown', sampleCount: 0 }` with a note.
- Calls `readRasters({ samples: [bandIndex] })` wrapped in `Promise.race` with 15-second timeout.
- Runs the existing min/max/unique-values analysis on the returned data.

**1d. Keep `fetchCogMetadata` as a convenience wrapper** — calls `fetchCogHeaderMetadata` then `fetchCogBandStatistics(url, 0, noDataValue)`, merges results. This preserves the existing API for `constraintMetadataHelpers.ts`.

**1e. Update `formatMetadataForDisplay`**:
- If `statisticsBand` is set, label the Data Statistics section as "Data Statistics (Band N)".
- If `ifdCountCapped`, show overview count as "≥ N (enumeration capped)".
- If `multiBand` and no statistics loaded yet, show "Select a band to view statistics."

### Task 2: Update `CogMetadataDialog` for two-phase loading with band selector

**File: `src/components/layers/components/CogMetadataDialog.tsx`**

**2a. New state variables**:
- `statisticsLoading: boolean`
- `statisticsError: string | null`
- `selectedBand: number` (default 0, displayed as 1-indexed to user)

**2b. Rewrite `loadMetadata`**:
- Call `fetchCogHeaderMetadata(url)` → set `rawMetadata` and `metadata` immediately (spinner clears, header sections visible).
- Then auto-trigger band statistics for band 0 (or selected band).

**2c. New `loadBandStatistics(bandIndex: number)` function**:
- Sets `statisticsLoading = true`, clears `statisticsError`.
- Calls `fetchCogBandStatistics(url, bandIndex, rawMetadata.noDataValue)`.
- Merges result into `rawMetadata` (setting `minValue`, `maxValue`, `dataNature`, `uniqueValues`, `sampleCount`, `statisticsBand`).
- Re-runs `formatMetadataForDisplay` to update displayed sections.
- On error/timeout: sets `statisticsError` with user-friendly message, does not fail the whole dialog.

**2d. Band selector UI** (rendered above the Data Statistics table, only when `rawMetadata?.multiBand` or `rawMetadata?.samplesPerPixel > 1`):
- `Select` dropdown labelled "Band:" with options 1 through `samplesPerPixel`.
- Changing selection calls `loadBandStatistics(newBandIndex)`.
- Small inline `Loader2` spinner next to dropdown while `statisticsLoading` is true.

**2e. Single-band files**: No dropdown shown. Statistics auto-load after header. Behavior identical to current but non-blocking.

**2f. Action buttons** (copy min/max, copy categories): Disabled while `statisticsLoading` is true. Enabled once band statistics have loaded.

### Files modified
- `src/utils/cogMetadata.ts` — split functions, add timeout/guards, update interface and formatter
- `src/components/layers/components/CogMetadataDialog.tsx` — two-phase loading, band selector

No changes needed to `src/utils/constraintMetadataHelpers.ts` since the existing `fetchCogMetadata` wrapper is preserved.

