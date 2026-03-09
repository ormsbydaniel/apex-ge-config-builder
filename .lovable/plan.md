

## Analysis

The phase-1 header fetch (`fetchCogHeaderMetadata`) is lightweight — it reads only TIFF headers via a single HTTP range request with a 5-second timeout. The `samplesPerPixel` field is available immediately from the first IFD without any raster data reads. For a typical layer with 1-10 COG data sources, this is negligible overhead.

**Performance verdict: Very feasible.** Each COG header fetch is ~1 small range request. Even with 20 COGs in a layer, the requests would complete in parallel within a second or two.

## Plan

### Approach
Add an async band count fetch inside `DataSourceItem` for COG-format entries, displaying a small badge like `"224 bands"` inline next to the format badge.

### Changes

**`src/components/layers/components/DataSourceItem.tsx`**
- Add a `useEffect` that fires for COG-format data sources, calling `fetchCogHeaderMetadata(url)` to get `samplesPerPixel`
- Store result in local state (e.g. `cogBandCount: number | null`)
- Only fetch once per URL (use the URL as the effect dependency)
- Show a subtle badge/text like `"224 bands"` next to the COG info icon when `cogBandCount > 1` (single-band COGs don't need the label since that's the default expectation)
- Show a brief loading state (small spinner or skeleton) while fetching

### What stays the same
- The (i) metadata dialog remains for full details (EPSG, compression, overview count, etc.)
- No schema or type changes needed
- No new dependencies

