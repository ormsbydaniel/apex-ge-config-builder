# Healthcheck Modal Redesign

Replace the current single-status table in `CompleteLayersDialog.tsx` with a richer grid that separates **Data Access** from **Performance**, streams results in real time as each layer is checked, and lets users expand a row for full details.

## What the user will see

```text
+----------------------------------------------------------------------------+
| Layer                | Data Access      | Performance      | Details       |
+----------------------------------------------------------------------------+
| > Sentinel-2 RGB     | [Pass]           | [Good]           | View details  |
| > Land Cover WMS     | [Partial Pass]   | [Average]        | View details  |
| v Bathymetry COG     | [Fail]           | [—]              | Hide details  |
|     URL details, errors, warnings, bytes, timing...                        |
| > Coastlines GeoJSON | [spinner] Checking | [spinner]        |               |
+----------------------------------------------------------------------------+
```

- Two independent badge columns per layer:
  - **Data Access**: `Pass` (green), `Partial Pass` (amber), `Fail` (red), `Not applicable` (muted, e.g. all-XYZ template layers).
  - **Performance**: `Good` (green), `Average` (amber), `Poor` (red), or `—` when data access failed (no perf signal available).
- While a layer is being checked, that row's two cells show an inline spinner with "Checking…" so the user sees exactly which layer is in flight.
- Rows that have not yet been reached show a muted "Queued" badge.
- A **View details** / **Hide details** button on each row toggles an inline expansion containing the existing per-URL breakdown (URL, type, status icon, error text, performance warning, bytes, etc.).
- Existing summary bar and filter checkboxes remain at the top, but their labels are updated to match the new badge vocabulary (Pass / Partial / Fail / Performance).

## Real-time updates

`validateBatchLayers` already takes an `onProgress(completed, total, layerName)` callback and processes layers in batches of 5. To stream per-layer results into the UI we need slightly richer progress reporting:

- Add an optional `onLayerResult(index, result)` callback to `validateBatchLayers` (and an `onLayerStart(index, layerName)` callback) in `src/utils/layerValidation.ts`. Existing `onProgress` is preserved for backward compatibility.
- In the dialog, on `onLayerStart` mark that index as `checking` in local state (drives the spinner). On `onLayerResult` merge the result into the `validationResults` Map immediately, so each row resolves as soon as its checks finish rather than waiting for the whole batch.
- Track an `inFlightIndices: Set<number>` in dialog state for spinner placement.

## Mapping validation results to the two columns

A single `LayerValidationResult.overallStatus` currently mixes reachability and performance. We derive the two column values from `urlResults` without changing the underlying validation logic:

- **Data Access** (looks only at reachability, ignoring `performance-warning`):
  - All non-skipped URLs valid → `Pass`
  - Some valid, some `error` → `Partial Pass`
  - All non-skipped URLs `error` → `Fail`
  - No validatable URLs (all skipped) → `Not applicable`
- **Performance** (only meaningful when Data Access is Pass or Partial Pass):
  - Any URL with `status === 'performance-warning'` → `Average` (single warning) or `Poor` (multiple warnings, or a COG/GeoJSON over a higher "poor" threshold — start with: 2+ warnings = Poor, 1 = Average)
  - Otherwise → `Good`
  - If Data Access is `Fail` → `—` (unknown)

This mapping lives in a small pure helper (e.g. `deriveHealthcheckColumns(result)`) inside the dialog file or a sibling util. No schema changes; `LayerValidationResult` is unchanged.

## Filter behaviour

Filters at the top of the dialog become two grouped sets:

- **Data Access**: Pass, Partial, Fail
- **Performance**: Good, Average, Poor

A row is shown if its Data Access value matches any selected Data Access filter AND its Performance value matches any selected Performance filter. Defaults: all checked.

## Files to change

- `src/utils/layerValidation.ts` — extend `validateBatchLayers` with `onLayerStart` and `onLayerResult` callbacks; keep existing `onProgress` working.
- `src/components/config/CompleteLayersDialog.tsx` — replace the current table with the two-column-status grid, wire up real-time callbacks, add per-row expand toggle and inline details, update filters and summary bar.
- (Optional) Extract the column-derivation helper and the new badge components into small siblings under `src/components/config/components/` if the dialog grows past ~500 lines, in line with the project's "favor cohesion" guideline — only split if it actually helps readability.

## Out of scope for step 1

- Changing the underlying probes or thresholds.
- Persisting healthcheck history.
- Re-running a single layer from the grid (could be a follow-up).
