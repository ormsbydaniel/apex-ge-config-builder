# Phase 1 — shared STAC asset access and summary badge

## Goal

Establish one safe way for later format-specific tools to identify and inspect a STAC asset, and refine the dataset-row badge now. This phase does not yet enable the RGB, vector-style, or field-detection controls for STAC.

## Verified current state

- `getEffectiveFormat` already returns the selected STAC asset's mapped format from `assets[0]` and `assetFormats`.
- `getStacSample` already resolves and caches the selected asset's sample URL in memory; resolved or signed URLs are not saved.
- The asset badge currently appears on the left between the STAC format badge and the dataset name, shows only the asset name, and uses the standard outline treatment.
- The existing tests cover one/multiple assets and omission for unsupported cases, but not the mapped format, badge placement, or colour treatment.

## Implementation

1. **Add shared inspection access**
   - Extend `src/utils/stacAssetFormat.ts` with an asynchronous resolver returning `{ format, url }` for a data source.
   - For ordinary sources, return the source's existing effective format and URL unchanged.
   - For STAC sources, require a known mapped asset format and resolve the selected asset through the existing cached `getStacSample` path.
   - Return an unavailable result when the source has no URL, no selected/mapped asset, or no resolved sample URL.
   - Keep sample URLs session-only and leave the saved data contract unchanged.

2. **Refine the dataset-row asset badge**
   - Remove the asset badge from the left-hand format/name group.
   - Render it in the right-hand metadata group, before the existing band information.
   - Display `asset name (format)` when a map entry exists, otherwise display the asset name only for older configurations.
   - Preserve the ordered `assets` array if a future configuration contains several assets.
   - Add a dedicated semantic muted-blue badge token for light and dark themes, then expose it through Tailwind and use only that token in the row.

3. **Tests and project tracking**
   - Extend `stacAssetFormat` tests for direct-source passthrough, STAC sample resolution, missing mappings, missing URLs, and unresolved samples.
   - Update the focused row tests for `data (cog)`, multiple assets in order, mapped-format fallback, and placement in the right-hand metadata group.
   - Record Phase 1 as completed in the existing STAC roadmap section after implementation.
   - Run the focused tests and TypeScript check; detailed visual review remains with the user.

## Compatibility

- No schema or TypeScript data-model changes.
- Older STAC configurations without `assets` or `assetFormats` still load and show no incorrect format.
- Direct COG, GeoJSON, FlatGeoBuf, CSV, and XYZ sources keep their existing URLs and behaviour.
- RGB/multiband, vector styling, field detection, charts, diagnostics, statistics, and constraints remain for later phases.
