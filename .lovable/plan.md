## Field Selector Dialog for Field Values pie charts

Add a UI for editing the `inline` source's `fields` array. The dialog auto-detects properties from the first vector source on the layer (GeoJSON first feature or FlatGeoBuf header) using the existing `detectFieldsFromSource` helper.

### Wire vector sources through to the form

**`src/components/layers/LayerFormHandler.tsx`**
- Alongside `cogSources`, derive `vectorSources` from `currentLayer.data` filtering for `format === 'geojson' || format === 'flatgeobuf'`.
- Pass as new `vectorSources` prop to `<ChartSourceForm />`.

**`src/components/layers/components/ChartSourceForm.tsx`**
- Extend `ChartSourceFormProps` with `vectorSources?: DataSourceItem[]` (default `[]`).

### New dialog

**`src/components/charts/FieldSelectorDialog.tsx`** (new file, modelled on `BandLabelEditorDialog`)
- Props: `open`, `onOpenChange`, `vectorSources`, `selectedFields: string[]`, `onSave: (fields: string[]) => void`.
- On open (inside a `useEffect` watching `open`, per project core rule): pick `vectorSources[0]`, call `detectFieldsFromSource(url, format)`, show spinner during fetch.
- Render a checkbox list of detected fields:
  - Numeric/integer fields enabled and primary, with a small type badge.
  - Non-numeric fields rendered with reduced opacity and a tooltip "Non-numeric — pie slice will be a placeholder value".
- Quick actions: **Select all numeric (n)** and **Clear all**.
- Manual-add input at the bottom (`+ Add` button or Enter key) — appends to a `manualFields` list and auto-checks it.
- Manual entries get a `manual` badge and a remove button.
- If `vectorSources.length === 0` or detection throws: show inline message and just expose the manual-add UI; previously-selected fields appear as manual entries.
- Save returns checked fields in stable order (detected order first, then manual order).

### Hook into the form's Field Values branch

**`src/components/layers/components/ChartSourceForm.tsx`**
- Replace the existing "Field Values configuration coming soon" placeholder (around lines 759–767) with:
  - A header row `[Settings2 icon] Selected Fields  [Edit fields…] button`.
  - A wrap of small chips for each selected field with a per-chip × button (removes from `inlineFields`).
  - Empty state: "No fields selected — click Edit fields to choose."
- Add `fieldDialogOpen` state and render `<FieldSelectorDialog />` next to the existing `<BandLabelEditorDialog />`.
- Add `inlineFields` to the dirty-tracking `useEffect` deps so toggling fields enables Save.

### Preview behaviour
`PlotlyChartViewer` already synthesizes equal-weighted placeholder values from `sources[0].fields` for inline pies — no changes needed.

### Memory
- Create `mem://features/charts/field-values-selector` describing detection (first GeoJSON feature / FGB header), numeric-vs-string handling, and manual-add fallback.
- Append a one-liner to `## Memories` in `mem://index.md`.

### Out of scope
- No schema changes (the `inline` source already accepts `fields: string[]`).
- No real numeric aggregation across features — synthesized placeholder values remain.
- No multi-source picker — first vector source wins.

### Files to change
- `src/components/layers/LayerFormHandler.tsx`
- `src/components/layers/components/ChartSourceForm.tsx`
- `src/components/charts/FieldSelectorDialog.tsx` (new)
- `mem://features/charts/field-values-selector` (new), `mem://index.md`