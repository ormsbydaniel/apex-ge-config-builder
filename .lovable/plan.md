## Store Axis Titles in Plotly's Native Shape

### Why
Plotly.js v2 requires `xaxis.title` to be an **object** `{ text, font }`, not a bare string. The legacy `titlefont` key is deprecated. Today we store the wrong shape (`title: "Wavelength"`, `titleFont: { size: 12 }`), so axis labels render nowhere.

Per your preference, we'll store the JSON in Plotly's correct shape and pass it straight through to the viewer — no transform layer.

### Target JSON shape

```json
"xaxis": {
  "title": { "text": "Wavelength", "font": { "size": 12 } },
  "tickfont": { "size": 10 },
  "showgrid": true,
  "type": "linear",
  "tickangle": 0,
  "tickformat": ",.0f",
  "ticksuffix": " nm"
}
```

### Changes

#### 1. `src/types/chart.ts` — `ChartAxis` interface
Replace string `title` and `titleFont` with a single nested object:
```ts
export interface ChartAxisTitle {
  text?: string;
  font?: ChartFont;
  [key: string]: unknown;
}
export interface ChartAxis {
  title?: ChartAxisTitle;   // was: string
  // remove titleFont
  tickfont?: ChartFont;
  ...
}
```

#### 2. `src/schemas/configSchema.ts` — `ChartAxisSchema`
- Replace `title: z.string().optional()` with `title: z.object({ text: z.string().optional(), font: ChartFontSchema.optional() }).passthrough().optional()`.
- Remove `titleFont`.

#### 3. `src/components/charts/ChartSettingsPanel.tsx` — UI
Read/write the nested shape:
- Label input: `value={config.layout?.xaxis?.title?.text || ''}` → `updateXAxis({ title: { ...xaxis.title, text } })`.
- Font-size input: `value={config.layout?.xaxis?.title?.font?.size ?? 10}` → `updateXAxis({ title: { ...xaxis.title, font: { ...xaxis.title?.font, size } } })`.
- Same for Y-axis.
- Drop the separate `titleFont` helpers and replace with title-mutating helpers.

#### 4. `src/components/charts/PlotlyChartViewer.tsx` — pass-through
Simplify:
- Remove `buildAxisConfig`'s `titlefont` line.
- For both branches, build axes by spreading the stored axis as-is, only adding a default title text when none is set:
  ```ts
  const xAxis = { ...config.layout?.xaxis };
  if (!xAxis.title?.text) xAxis.title = { ...xAxis.title, text: 'Band' };
  ```
  (For non-pixel-values main branch: default x to `typeof config.x === 'string' ? config.x : undefined`; histogram defaults stay as today; y default stays "Value"/"Count" where applicable, otherwise omit.)

#### 5. Backwards-compatibility migration
Existing saved configs and the user's chart JSON examples store `title` as a string and `titleFont` at the axis root. Add a one-time normalization in `useValidatedConfig.ts` (or a dedicated `migrateChartConfig` util invoked there) that, for every chart's `layout.xaxis`/`layout.yaxis`:
- If `axis.title` is a string, rewrite to `{ text: axis.title, ...(axis.titleFont ? { font: axis.titleFont } : {}) }`.
- Delete `axis.titleFont`.

This keeps existing project files working and converts them on load so subsequent saves are in the new shape.

### Result
- Stored JSON matches Plotly's spec exactly.
- Viewer is a thin pass-through with only sensible defaults.
- Old configs auto-migrate on load; users see their axis labels render immediately.