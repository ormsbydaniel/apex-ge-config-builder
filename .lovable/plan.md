# STAC asset formats across the UI

## Goal

Treat a STAC dataset according to its selected asset's saved format everywhere the builder offers format-specific tools, while resolving a sample asset URL only when a tool must inspect the underlying file.

This will be delivered in phases so the existing direct-file workflows remain stable.

## Verified current state

- `getEffectiveFormat` already translates `format: "stac"` plus the first selected asset's `assetFormats` entry into `cog`, `geojson`, `flatgeobuf`, `csv`, or `xyz`.
- `getStacSample` already resolves and caches a selected asset's sample URL in memory without persisting signed asset URLs.
- Most remaining UI gates still inspect `item.format` directly. This hides raster and vector tools for STAC sources even when `assetFormats` identifies a supported asset.
- Raster metadata, histograms, vector field detection, and vector style sampling currently receive `item.url`; for STAC this is the item/collection endpoint rather than the selected asset file, so changing only the visibility checks would not be sufficient.
- The affected core paths are the data-visualisation summary, RGB/computed/index editor, per-dataset composite utilities, vector styling dialog, layer field controls, field detection, and row-level COG/FlatGeoBuf tools. Secondary paths include charts, URL diagnostics, draw-order suggestions, statistics, constraints, and import/service handling.

## Phase 1 — shared access rules and summary badge

1. Add a small shared resolver alongside the existing STAC asset helpers:
   - synchronous effective-format lookup for deciding which controls apply;
   - asynchronous `{ format, url }` access for file inspection, returning the direct URL unchanged for ordinary sources and the cached sample asset URL for STAC sources;
   - a clear unavailable result when an older STAC source has no asset mapping or no resolvable sample.
2. Refine the layer-row asset badge:
   - move it into the right-hand metadata group beside the bands badge;
   - show `asset name (format)`, falling back to just the name when no mapping exists;
   - use a muted blue semantic badge treatment in light and dark themes;
   - preserve asset order and support older STAC configs without assets.
3. Extend the focused asset helper and row tests. No schema changes.

## Phase 2 — primary raster and vector workflows

### Raster / multi-band

- Replace direct `format === "cog"` gates in the visualisation summary, RGB editor, and per-dataset recipe/scope utilities with the shared effective-format check.
- Resolve a sample COG URL before reading headers or histograms. Batch stretch will resolve each participating STAC dataset independently and keep per-dataset settings attached to the original STAC item.
- Keep saved configuration unchanged: recipes, bands, compiled styles, and `styleSource` remain on the STAC data item; resolved sample URLs remain memory-only.
- Make row-level band selection and COG metadata available for STAC COG assets using the same resolved sample URL.

### Vector styling and fields

- Treat STAC assets mapped to GeoJSON or FlatGeoBuf as vector sources in the layer summary, vector-style editor, and Manage Fields visibility checks.
- Before sampling attributes or populating field details, resolve the selected STAC asset URL and pass its effective format to the existing GeoJSON/FlatGeoBuf readers.
- Preserve ordered multi-file probing, early abort, and existing FlatGeoBuf safety limits.
- If a sample cannot be resolved, keep manual field/style editing available and show the existing actionable error rather than hiding the whole control.

## Phase 3 — secondary format-dependent features

Audit and update the remaining user-facing consumers with the same two-step rule: use effective format for eligibility, resolve a sample URL only for file interrogation.

- COG/vector chart source eligibility and sample previews.
- URL validation and COG/GeoJSON performance probes.
- Draw-order format classification.
- Statistics eligibility and vector statistics sources.
- COG metadata actions used by constraints.
- Workflow/vector-source detection and other remaining non-import UI gates.

STAC temporal pixel-series expansion is not a simple format substitution: a collection endpoint represents many items and dates. Keep that workflow unchanged until a dedicated item-expansion design is agreed rather than silently treating one sample asset as the full series.

## Compatibility and failure behaviour

- No data-model or schema changes; `assets` and `assetFormats` remain optional on load.
- Direct COG, GeoJSON, FlatGeoBuf, CSV, and XYZ behaviour must remain unchanged.
- A STAC source with a missing/unknown mapping remains generic STAC and does not receive an incorrect tool.
- Signed/resolved asset URLs are never written to configuration.
- Asset-resolution failures are handled at the requested tool, without blocking configuration loading or unrelated editing.

## Verification at each phase

- Unit-test direct-source passthrough, STAC resolution, missing mappings, and failed/empty samples.
- Add focused UI tests for badge placement/text and eligibility of STAC COG/vector controls.
- Add utility tests proving raster/vector probes receive the resolved asset URL and effective format while saved items retain their STAC endpoint.
- Run the relevant focused tests and TypeScript check after each phase. Detailed visual review remains with the user.
