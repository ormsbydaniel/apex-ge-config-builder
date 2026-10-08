# Discover STAC asset names from the first item

## Goal

In the data source form's STAC section, let the user fetch the asset names advertised by the first item instead of typing them from prior knowledge. Picking an asset from the list selects it and immediately runs the existing format detection.

## User experience

1. User enters a STAC items/collection URL as today.
2. A new **"List assets"** button (next to the asset-name input) fetches the first item.
3. The asset names appear as a dropdown, each showing its detected format (e.g. `classification — COG`).
4. Choosing one replaces the current asset selection with that single name (single-asset policy) and triggers the same detection the **Detect** button runs: asset format is set, band labels are captured, and a confirmation message appears.
5. Manual typing stays available as a fallback for items that can't be fetched (auth, offline) or assets not present on the first item.
6. Failures (network, empty item list, no assets) show a clear message and leave the form unchanged.

## Technical details

- **`src/utils/stacAssetFormat.ts`**: add `listStacAssets(url, fetcher?)` returning `{ name, title?, format? }[]`. It reuses the existing `fetchSampleItem` helper and `detectAssetFormat`, so no new fetching logic. Refactor `sampleStacAsset` to share the sample-item fetch.
- **`src/components/layers/DataSourceForm.tsx`** (`renderStacOptions`):
  - New state: `discoveredAssets`, `isListingAssets`.
  - "List assets" button (disabled without a URL, spinner while fetching).
  - Dropdown rendered once assets are discovered; `onValueChange` sets `stacAssets` to `[name]`, then runs the existing detect flow (`sampleStacAsset`) to fill `stacAssetFormat` and `stacBandLabels`.
  - Discovery results are cleared when the URL changes so stale names aren't offered.
- **Tests** (`src/utils/__tests__/stacAssetFormat.test.ts`): `listStacAssets` with a mocked fetcher — items endpoint, single item, collection-level assets, empty/no-asset cases.
- No schema or type changes: `assets` and `assetFormat` already exist.

## Verification

- New unit tests plus existing STAC tests pass.
- Typecheck and build pass.
- Playwright: open the data source form with a real STAC URL, list assets, pick one, confirm format detection and band labels populate.
