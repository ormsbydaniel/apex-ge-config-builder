## Hide X/Y axis settings for Pie charts

In `src/components/charts/ChartSettingsPanel.tsx` the "Axis Settings" section renders a 5-column grid: X-Axis | divider | Y-Axis | divider | Legend. For pie charts, axes don't apply, so only the Legend column should be shown.

### Changes

**File:** `src/components/charts/ChartSettingsPanel.tsx`

1. Detect pie mode by checking `config.traces?.[0]?.type === 'pie'` (and/or `config.chartType === 'pie'`) — store in an `isPie` constant.
2. When `isPie` is true:
   - Switch the wrapper grid from `grid-cols-[1fr_auto_1fr_auto_1fr]` to a single-column layout (e.g. `grid-cols-1`) so the Legend column takes the full width without leaving empty space.
   - Skip rendering the X-Axis block, the first divider, the Y-Axis block, and the second divider — render only the Legend block.
3. Leave all non-pie chart rendering unchanged.

No schema, type, or data-flow changes are required — this is purely a conditional render in the settings panel. The underlying `layout.xaxis` / `layout.yaxis` config is preserved untouched if it happens to exist in JSON.

### Out of scope

- No changes to `PlotlyChartViewer`, `ChartSourceForm`, or schemas.
- The Chart Titles section above and Preview below remain unchanged (consistent with the established "same as other chart types" behaviour).