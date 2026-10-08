# Phase 2B — STAC COG multi-band styling

## Goal

Make STAC datasets whose selected asset is mapped as `cog` behave like direct COG datasets throughout Multi-band visualisations, while preserving the saved STAC endpoint and resolving sample asset URLs only in memory.

## Implementation

1. **Use effective COG identity everywhere**
   - Update the RGB composite scope utilities so direct COGs and STAC assets mapped as COGs share one `isCog` decision.
   - Apply that decision to first-dataset selection, per-dataset navigation, copy/reset/apply-all behaviour, visualisation counts, and existing index/computed summaries.
   - Keep source-array indices stable so styles are saved back to the correct STAC data item.

2. **Resolve inspection URLs inside the editor**
   - Resolve each eligible dataset through the shared `resolveDataSourceInspectionAccess` helper when the dialog opens or its selected dataset changes.
   - Use the in-memory resolved COG URL for header metadata, band count, no-data detection, histograms, automatic stretches, and per-dataset batch stretches.
   - Keep direct COG behaviour unchanged, guard stale asynchronous results, and surface unavailable samples as an inspection failure without removing saved styling.
   - Never copy a resolved or signed asset URL into the configuration.

3. **Preserve all existing styling workflows**
   - Enable standard composites, spectral indices, computed composites, recipes, per-dataset overrides, and copy/apply-all for mapped STAC COG assets.
   - Continue saving only rendering fields (`bands`, `style`, `spectralIndex`, `computedComposite`, and scope markers) onto the original data item alongside its STAC fields.
   - Leave vector assets, fields, charts, statistics, constraints, and other format-dependent tools for later phases.

4. **Tests and tracking**
   - Extend per-dataset and style-scope tests with mixed direct COG, mapped STAC COG, and non-COG STAC cases.
   - Add focused editor tests proving metadata and histogram reads use the resolved asset URL while saved output retains the STAC URL and asset mapping.
   - Update the STAC roadmap entry, run focused tests and TypeScript checking, and leave detailed visual review to you.

## Compatibility

- No schema or saved-data contract changes.
- Older STAC sources without `assetFormats`, and STAC assets mapped to non-COG formats, remain excluded from multi-band styling.
- Direct COG layers retain their current behaviour.
