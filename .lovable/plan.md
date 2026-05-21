## Problem

After adding the WMS `parameters` editor, opening Preview shows the GE viewer with the *default* config — `layout` collapses to just `{ navigation: { title: "Geospatial Explorer - Custom Config" } }` in the console. The user reports this happens whether or not any WMS source actually has `parameters`, so it isn't an editor-runtime bug — something added in the last change is making the loaded config fail validation (or be replaced) on its way to the viewer.

Two likely culprits introduced by the previous change:

1. **Strict `parameters` schema.** `DataSourceItemSchema` now declares `parameters: z.record(z.string(), z.string()).optional()`. Real WMS configs (including the ECMWF sample we worked from) carry values that aren't always strings — e.g. `transparent: true`, `format: "image/png"`, numeric `tiled` flags etc. Because `parameters` is now a *known* field on the schema, `.passthrough()` no longer rescues it: any non-string value makes the whole `DataSourceItem` fail to parse. Depending on which call site uses `parse` vs `safeParse`, this can cascade into the config being treated as invalid and replaced with the default.

2. **Form save rebuilds the data source from scratch.** `handleSave` in `DataSourceForm.tsx` constructs `dataSourceItem` from a fixed set of fields and only re-adds `parameters` when `selectedFormat === 'wms'`. Any passthrough fields the user already had on the source (`env`, `styles`, `time`, `transparent`, vendor extensions, etc.) are silently dropped on every edit. The previous behaviour was the same shape, but now that we explicitly *care* about `parameters`, the regression on every other passthrough field is part of the same root issue and worth fixing in the same pass.

## Plan

### 1. Loosen the WMS parameters schema

`src/schemas/configSchema.ts`:

- Change `parameters: z.record(z.string(), z.string()).optional()` to `parameters: z.record(z.string(), z.unknown()).optional()` on `DataSourceItemSchema`.
- Keep `.passthrough()` as-is.

`src/types/dataSource.ts`:

- Widen `parameters?: Record<string, string>` to `parameters?: Record<string, string | number | boolean>` to match real-world WMS values.

The UI editor continues to read/write strings (that's correct for a textbox), but the *schema* no longer rejects existing configs that store booleans/numbers.

### 2. Preserve passthrough fields on edit

`src/components/layers/DataSourceForm.tsx`, `handleSave`:

- When `editingDataSource` exists, start the new object with `...editingDataSource` and then overwrite the known fields (`url`, `format`, `zIndex`, `layers`, `position`, `level`, `timestamps`, `useTimeParameter`, `parameters`).
- Explicitly `delete` fields that no longer apply after a format change (e.g. drop `parameters` when `selectedFormat !== 'wms'`, drop `useTimeParameter` when not WMS/WMTS, drop `timestamps` when using TIME parameter, drop `layers` for non-OGC formats).
- For the *create* path (no `editingDataSource`), keep the current explicit construction.

### 3. Verify

- Reload the ECMWF config, open Preview, confirm the viewer receives the full layout/sources (not the default).
- Edit a non-WMS source (e.g. an XYZ base layer) that has vendor passthrough fields, save, re-open — passthrough fields still present.
- Edit a WMS source, add/remove parameters, save — parameters object round-trips; switching its format to `xyz` drops the parameters key on save.
- Re-export the config and diff against the original — no field loss beyond intentional edits.

### Out of scope

- Reworking how `useValidatedConfig` reports schema errors.
- WMTS/WFS parameter editors.
- Auto-converting historical string values like `"true"` to booleans (kept as-is to avoid surprises).
