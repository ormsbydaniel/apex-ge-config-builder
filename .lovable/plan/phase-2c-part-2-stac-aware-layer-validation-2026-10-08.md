# Phase 2C Part 2 — STAC-aware layer validation

## Goal

Layer validation should check STAC datasets properly. Today it treats them as plain file links: it only checks that the STAC address responds, then skips the asset and format checks.

## What the author sees

The validation dialog will show a STAC dataset row with one of these outcomes:

- **Valid**: the STAC address responds, returns items, the chosen asset exists on the first item, and that asset's file can be reached.
- **Performance warning**: everything is reachable, but the asset gets the same check as a direct file of its format. That means the large-file check for GeoJSON, or the tile/overview/compression check for COG. Insecure-link (HTTP) warnings apply to the asset link as well.
- **Error** with a clear reason:
  - The STAC address does not respond or returns no items.
  - The named asset is not on the first item (the message lists the asset names it did find).
  - The asset file cannot be reached.
- **Warning (not error)** when the STAC dataset has no asset name or no format set. This covers older configurations, which are still allowed to load. The message suggests opening the dataset and picking an asset.

Rows keep showing the saved STAC address. The temporary asset link is used only for the check and is never saved or shown in full.

## Implementation

1. In `src/utils/layerValidation.ts`, add a `stac` branch to `validateUrl` that receives the full data item (`assets`, `assetFormats`):
   - Step 1: check that the STAC endpoint responds, using the existing direct-URL check.
   - Step 2: read the sample with `getStacSample(url, assets)`. Map "no items", "asset missing" and "no sample href" to error messages.
   - Step 3: run the existing direct checks (reachability, GeoJSON size, COG performance, mixed content) against the in-memory sample URL, using `getEffectiveFormat`.
   - Report the result under the saved STAC URL. The note says which asset was checked, e.g. "Checked asset data (flatgeobuf)".
2. Pass `assets`/`assetFormats` from `validateLayerUrls` for both data and statistics items. Signatures for non-STAC callers stay unchanged.
3. If the "missing asset name/format" warning comes up and the result type has no suitable field, use the existing `performance-warning` status plus `warning` text.

## Tests

- New `src/utils/__tests__/layerValidation.stac.test.ts`, with fetch and `getStacSample` mocked. Cases:
  - valid mapped COG
  - valid mapped FlatGeobuf
  - endpoint unreachable
  - no items
  - asset not found
  - asset href unreachable
  - missing asset name or format gives a warning
  - the result URL equals the saved STAC URL, never the sample href
- Run the focused tests and a TypeScript check. Visual review is left to you.

## Out of scope

- Validating every item or every asset (only the first item is sampled).
- Queryables and CQL2 filters (Phase 3).
- Changes to the validation dialog layout.
- Changes to the schema or saved data.
