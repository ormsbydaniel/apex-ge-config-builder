## Goal

Allow users to attach arbitrary URL parameters (e.g. `token=public`, `styles=default`) to **WMS** data sources, and have those parameters round-trip cleanly through import, export, edit, and copy. Shape mirrors the ECMWF example config:

```jsonc
"data": [{
  "url": "https://eccharts.ecmwf.int/wms/",
  "format": "wms",
  "layers": "composition_pm2p5",
  "parameters": { "token": "public", "styles": "default" }
}]
```

WMTS is **not** in scope — the parameters editor only appears for WMS layers.

## Storage shape

Keep the existing object-map shape already present in the example: `parameters: Record<string, string>`. UI-side the user edits an ordered list of `{ key, value }` rows; we serialize to/from the object on save/load. Empty keys are skipped; duplicate keys take the last value.

## Changes

### 1. Types & schema

- `src/types/dataSource.ts` — add `parameters?: Record<string, string>` to `DataSourceItem`.
- `src/schemas/configSchema.ts` — add `parameters: z.record(z.string(), z.string()).optional()` to `DataSourceItemSchema`. The schema already has `.passthrough()`, so existing configs with `parameters` survive validation — this just makes it first-class and typed.

### 2. Data source form UI (`src/components/layers/DataSourceForm.tsx`)

- Render a new "Parameters" section **only** when `selectedFormat === 'wms'` (both Direct Connection and From Service branches).
- New component `src/components/layers/ParametersEditor.tsx`:
  - List of rows with `Key` + `Value` inputs and a remove button per row.
  - "Add parameter" button appends an empty row.
  - Reserved keys blocked (case-insensitive) to avoid collisions with viewer-managed values: `time`, `layers`, `service`, `version`, `request`. Inline helper text explains.
  - Emits `Record<string, string>` upward; marks the form dirty.
- New form state in `DataSourceForm`:
  - `parameters` rows state initialized from `editingDataSource?.parameters`.
  - Re-init inside the existing `useEffect` that syncs from `editingDataSource` (project rule: dialog state initialized in useEffect watching the source prop).
- On save (`dataSourceItem` construction):
  - Convert rows to an object, drop empty keys.
  - Spread `...(selectedFormat === 'wms' && Object.keys(paramsObj).length > 0 && { parameters: paramsObj })`.
  - Single merged dispatch (project rule: avoid split dispatches).
- If the user switches format away from WMS, `parameters` is dropped from the saved item.

### 3. Copy / duplicate layer

Audit `src/utils/` and layer-card actions for copy/duplicate paths. Because `parameters` is a plain JSON object and existing copy paths use spread or deep JSON clone, no change is expected — verify only and add a deep clone if a shallow spread is found.

### 4. Import / export

- Import: Zod passthrough already preserves the field; the explicit schema entry types it. No transformer change in `src/utils/importTransformations/`.
- Export: existing pipeline serializes the full `DataSourceItem`. Per the Export Options ordering rule, place `parameters` after `layers` / `useTimeParameter` in the sort utility.

### 5. Verification

- Re-import the supplied `config_ecmwf_*.json`; the two CAMS WMS layers should round-trip with `parameters` intact.
- Edit one via the UI, add a new key, save, re-export — confirm presence and order.
- Duplicate a WMS layer; confirm parameters copied.
- Switch a layer's format from `wms` to `xyz` or `wmts`; parameters should be dropped on save and the UI section should disappear.
- Open a WMTS layer in the editor — no Parameters section is shown.

### 6. Docs

- `docs/data-sources/wms-wmts-wfs.md` — short "Custom parameters (WMS)" subsection explaining use cases (auth tokens, style overrides) and that this is WMS-only.

## Out of scope

- WMTS and WFS parameter editors.
- Per-parameter typing (numbers/booleans) — values stored as strings; viewer appends them as query string params.
- Templating / variable substitution in values.
