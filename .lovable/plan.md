# Regression test scope for the CLMS catalogue work

The catalogue feature is mostly additive, but it touched four shared code paths that
other features depend on. Those are the areas worth regression testing.

## Shared code paths that changed

| Shared area | File | Why it matters |
|---|---|---|
| Add-data-source pipeline | `src/hooks/useLayerOperations.ts` (`handleDataSourceAdded`) | Every data source added from any browser (WMS, WMTS, XYZ, COG, STAC, S3, catalogue) flows through here. It now also writes `layer.meta` styling and strips transient keys. |
| Data source form | `src/components/layers/DataSourceForm.tsx` | Carries both `__temporalSuggestion` and `__styleSuggestion`, and now derives the format from `serviceType`. |
| Service add / validate | `src/hooks/useServices.ts`, `src/hooks/useBulkServiceValidation.ts`, `src/utils/serviceProbes.ts` | A new `catalogue` service kind was added to the classifier, health check counters, and progress accounting. |
| Config schema and types | `src/schemas/configSchema.ts`, `src/types/service.ts` | `catalogue` added to `sourceType`/`format` enums; catalogue capability shape added. |

## Regression tests to run

### 1. Adding layers from non-catalogue sources (highest risk)
For WMS, WMTS, XYZ, COG, GeoJSON/FlatGeoBuf, CSV, STAC and S3 in turn:

- Add a data source to a **new empty layer** and confirm the layer meta is untouched
  (no stray categories, colormaps, min/max, startColor/endColor or units appear).
- Add a data source to a layer that **already has categories or a colormap** and confirm
  the existing styling is preserved.
- Export the config and confirm no `__styleSuggestion` or `__temporalSuggestion` key
  leaks into the JSON.

### 2. Time dimension auto-population
- WMS/WMTS layer with a `Dimension` time extent: timeframe and default timestamp
  still auto-populate on a layer with no timeframe, and are **not** overwritten on a
  layer that already has one.
- Adding several layers at once (bulk add) applies at most one suggestion.

### 3. Services manager and health check
- Add a mix of service types (OGC, STAC, S3, catalogue) and run the bulk health check:
  progress counters complete, no stuck in-flight counts, per-service statuses correct.
- Remove and re-add a catalogue service; confirm the other services' statuses are unaffected.
- Confirm the recommended services modal still adds non-catalogue services correctly.

### 4. Config load / save round trip
- Load an existing (pre-catalogue) config and confirm it validates without warnings.
- Save a config containing a catalogue-sourced layer, reload it, and confirm categories,
  colormaps, gradient min/max/colours and units all survive the round trip
  (schema, TypeScript interface and validation hook all in agreement).
- Load one of the remote example configs to confirm the manifest path is unaffected.

### 5. Layer styling UI
- Open the Categories editor and the Colormap editor on a catalogue-populated layer and
  confirm the values are editable and re-saveable as normal.
- Confirm the QA / legend warning icons behave correctly for catalogue layers
  (auto-generated legend should not be flagged as missing).

### 6. Automated checks
- `bunx vitest run` — existing suites plus `catalogueLegend`, `timeDimension`, schema tests.
- Typecheck and app build.
- `mkdocs build --strict` for the docs changes.

## Areas confirmed **not** affected

- Stories / storymaps, charts, constraints, workflows, vector styling and the preview
  viewer were not touched by the catalogue work; only run smoke checks there.
