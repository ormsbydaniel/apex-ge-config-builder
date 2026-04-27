## Add "Field Values" chart source type (inline) — JSON-first

Adds a fourth chart source type. Schema, types, and the Plotly preview support the new `"inline"` source so charts authored directly in JSON render in the preview. UI gets a fourth button ("Field Values") and a placeholder data-config panel; the field-picker UI is deferred to a follow-up prompt.

### Target JSON

```json
{
  "title": "Land Use - Pie",
  "sources": [{ "type": "inline", "fields": ["treecover", "shrubland", "grassland", "cropland", "builtup"] }],
  "x": "field",
  "traces": [{ "y": "value", "type": "pie" }],
  "layout": { "height": 400, "showlegend": true, "hole": 4 }
}
```

Semantics:
- `sources[0].type === "inline"` → data comes from the layer itself (vector feature properties).
- `sources[0].fields` is the ordered list of property names to plot.
- `x: "field"` and `traces[0].y: "value"` are placeholders that map onto the synthesized `{ field, value }` rows produced by the viewer at runtime.
- `traces[0].type: "pie"` selects the pie renderer.

### Changes

1. **Schema + types**
   - `src/schemas/configSchema.ts`: extend source `type` enum with `'inline'`; add optional `fields: z.array(z.string())` on `ChartSourceSchema`.
   - `src/types/chart.ts`: extend `ChartSource.type` union with `'inline'`; add `fields?: string[]`.

2. **PlotlyChartViewer — render inline pie from JSON**
   - File: `src/components/charts/PlotlyChartViewer.tsx`
   - Detect `config.sources?.[0]?.type === 'inline'`.
   - When the first trace is `type: 'pie'`:
     - Build `labels` from `sources[0].fields`.
     - Build `values` as a placeholder `1` per field (until real GeoJSON wiring lands), so slices render with equal weight.
     - Emit a Plotly pie trace honouring `layout.hole`, `layout.showlegend`, `layout.height`, and `layout.legend`.
   - When the first trace is XY (`scatter`/`bar`): synthesize rows `[{ field, value }, ...]` from `fields` (placeholder `value: 1`) and feed the existing XY pipeline so future bar/line variants will also render.
   - Keep all existing CSV / pixelValues paths untouched.

3. **Chart-type selector — Pie-only mode**
   - File: `src/components/charts/ChartTypeSelector.tsx`
   - Add `restrictToPie?: boolean` (default `false`); existing call sites unchanged.
   - When `true`: Line / Area / Bar / Histogram render as the existing greyed-out style with tooltip "Available in a future release for Field Values"; Pie becomes a real, selectable `ToggleGroupItem` and the default.

4. **ChartSourceForm — fourth button + stub config panel**
   - File: `src/components/layers/components/ChartSourceForm.tsx`
   - Widen `sourceType` to `'service' | 'direct' | 'pixelValues' | 'fieldValues'`. Hydrate `'fieldValues'` when `editingChart?.sources?.[0]?.type === 'inline'`.
   - Source-type grid: `grid-cols-3` → `grid-cols-4`. Add fourth card "Field Values" / "Charts from vector data fields" with a lucide icon (`ListTree`).
   - Hide CSV URL input and skip the COG / pixelValues blocks for `fieldValues` (extend the existing `sourceType !== 'pixelValues'` guards).
   - On entering `fieldValues` (and when no inline pie config exists yet), set `chartConfig` to:
     ```ts
     { x: 'field',
       traces: [{ y: 'value', type: 'pie' }],
       layout: { height: 400, showlegend: true } }
     ```
   - In the data section render a placeholder: "Field Values configuration coming soon — edit the JSON directly to test."
   - Pass `restrictToPie` to `ChartTypeSelector` for `fieldValues`.
   - On save: build `sources: [{ type: 'inline', fields: editingChart?.sources?.[0]?.fields ?? [] }]` so existing `fields` round-trip; `chartTitle`, `chartSubtitle`, layout, traces persist as today.
   - Treat `fieldValues` as ready (`isPixelValuesReady`-equivalent) so Settings + Preview sections render without needing a CSV URL.

### Out of scope (deferred)

- Reading actual property values from the parent layer's GeoJSON / FlatGeoBuf source (preview uses placeholder values of `1`).
- UI for editing the `fields` array.
- Enabling Line / Area / Bar for field values.

### Files to edit

- `src/schemas/configSchema.ts`
- `src/types/chart.ts`
- `src/components/charts/PlotlyChartViewer.tsx`
- `src/components/charts/ChartTypeSelector.tsx`
- `src/components/layers/components/ChartSourceForm.tsx`
