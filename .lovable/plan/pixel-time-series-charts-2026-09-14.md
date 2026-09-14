# Pixel time series charts

Add a fifth chart data source type — **Pixel Time Series** — for layers built from a stack of COGs with timestamps. The Geospatial Explorer fetches the value of one chosen band from each COG at the clicked pixel and plots date against value.

## Target JSON

```json
{
  "title": "Pixel time series",
  "traces": [{ "name": "Land cover class", "mode": "lines+markers" }],
  "layout": {
    "height": 360,
    "xaxis": { "title": { "text": "Date" }, "type": "category" },
    "yaxis": { "title": { "text": "Class value" } }
  },
  "sources": [{ "type": "pixelTimeSeries", "bandIndex": 0 }]
}
```

Axes stay nested under `layout`, consistent with every other chart the builder writes.

## What the author sees

- The **Add Chart Source** picker gains a fifth card, **Pixel Time Series** — "Value of one band over time from a COG time series".
- The card is only selectable when the layer has more than one COG dataset and those datasets carry timestamps. Otherwise it is greyed out with a short note explaining what the layer needs.
- Choosing it shows:
  - A **Band** dropdown listing the bands detected from the first COG in the stack (labels where the COG provides them, otherwise `Band 1`, `Band 2`, …). The selection is saved as a zero-based `bandIndex`.
  - A read-only summary of how many dated datasets will be plotted and the date range.
  - The usual Title / Subtitle, trace styling and chart settings panels already used by other chart types.
- The preview draws a placeholder line using the layer's actual dataset dates on the X axis with sample values, so the author can judge titles, styling and height without any COG downloads.
- Editing an existing `pixelTimeSeries` chart reopens in this mode with band and styling restored.

## Technical notes

- `src/types/chart.ts` — add `'pixelTimeSeries'` to `ChartSource.type` and an optional `bandIndex?: number`.
- `src/schemas/configSchema.ts` — extend the `ChartSourceSchema` type enum and add optional `bandIndex` (non-negative integer). Schema stays `.passthrough()`.
- `src/components/layers/LayerFormHandler.tsx` — alongside `cogSources`, derive the timestamped COG subset and pass it to the form so availability and dates can be computed.
- `src/components/layers/components/ChartSourceForm.tsx`
  - widen the `sourceType` union, add the fifth picker card with its disabled state and hydrate from `editingChart.sources[0].type`;
  - band detection reuses `fetchCogHeaderMetadata` against the first timestamped COG; the existing band-label editor is not reused — a simple select is enough;
  - default trace on entry: `{ name: 'Value', type: 'scatter', mode: 'lines+markers' }`; default layout `{ height: 360, xaxis: { type: 'category', title: { text: 'Date' } }, yaxis: { title: { text: 'Value' } } }`;
  - `handleSubmit` gains a branch emitting `sources: [{ type: 'pixelTimeSeries', bandIndex, label? }]` and drops `x` (dates come from the layer at runtime).
- `src/components/charts/PlotlyChartViewer.tsx` — add an `isPixelTimeSeries` path taking dates via a new optional `sampleXLabels` prop and placeholder Y values, reusing the existing trace-mapping and `buildAxis` code.
- Documentation: new `docs/charts/pixel-time-series.md`, plus rows in `docs/charts/overview.md`, `docs/charts/index.md` and the `sources[]` line in `docs/reference/json-schema.md`. Rebuild the guide with `mkdocs build --strict`.
- Tests: a Zod round-trip test that a `pixelTimeSeries` chart survives import/export with `bandIndex` intact.

## Out of scope

- Any runtime fetching of per-date pixel values in the builder preview.
- Explorer-side rendering (handled by the Geospatial Explorer bundle).
