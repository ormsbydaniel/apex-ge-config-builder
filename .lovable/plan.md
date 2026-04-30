# Speedometer score gauges in Healthcheck modal

Add two compact speedometer-style gauges to the top-right (column 3) of the Healthcheck modal header. One shows a **Data Access** score out of 100, the other a **Performance** score out of 100, both computed live from the per-layer healthcheck results.

## Files
- `src/utils/healthcheckColumns.ts` — add scoring helpers (pure functions).
- `src/components/config/HealthcheckScoreGauge.tsx` — new component (small, focused).
- `src/components/config/CompleteLayersDialog.tsx` — render the two gauges in the reserved column 3 of the header grid.

## 1. Scoring logic

Both scores use a weighted average of per-layer status values, expressed as a 0–100 integer. `na` (not applicable) layers are excluded from the denominator so a layer that genuinely has nothing to check cannot drag the score up or down.

### Per-status weights

```text
Data Access:   pass = 100   partial = 50   fail = 0     na = excluded
Performance:   good = 100   average = 50   poor = 0     na = excluded
```

### Formula

```text
score = round( sum(weight for each non-na layer) / count(non-na layers) )
```

If every layer is `na` (or there are zero results yet), the score is **null** and the gauge renders an "—" placeholder with an empty arc.

### Rationale
- Pass/Good = full credit, Fail/Poor = zero credit, Partial/Average = half credit. Matches the 3-level status model already used everywhere else in the dialog.
- Equal weighting per layer keeps the formula obvious to users; no per-layer multipliers or hidden weighting.
- Excluding `na` avoids the (common) case where a vector layer with no performance signal would otherwise be scored as 0 or 100 arbitrarily.

### Color thresholds (gauge arc + score text)
```text
score >= 80  → green   (text-green-600,  stroke hsl(var(--chart-1)) or a green token)
score >= 50  → amber   (text-amber-600)
score <  50  → red     (text-red-600)
score null   → muted-foreground
```
Use existing semantic Tailwind colors already in use across the modal (`text-green-600`, `text-amber-600`, `text-red-600`) so the gauges visually match the counter rows in the Results card.

### Helper API (pure, easy to unit test later)
In `src/utils/healthcheckColumns.ts`:

```ts
export type DataAccessStatus = 'pass' | 'partial' | 'fail' | 'na';
export type PerformanceStatus = 'good' | 'average' | 'poor' | 'na';

const dataAccessWeight: Record<DataAccessStatus, number | null> = {
  pass: 100, partial: 50, fail: 0, na: null,
};
const performanceWeight: Record<PerformanceStatus, number | null> = {
  good: 100, average: 50, poor: 0, na: null,
};

export const computeDataAccessScore = (
  results: LayerValidationResult[]
): number | null => { /* weighted avg, exclude na */ };

export const computePerformanceScore = (
  results: LayerValidationResult[]
): number | null => { /* weighted avg, exclude na */ };
```

Both helpers iterate `results`, derive `{dataAccess, performance}` via the existing `deriveHealthcheckColumns`, sum the relevant weight when not `null`, and return `Math.round(sum / count)` or `null` when count is 0.

## 2. `<HealthcheckScoreGauge />` component

A compact half-donut "speedometer" rendered with `recharts` `RadialBarChart`. Avoid pulling in a new dependency — recharts is already in `package.json`.

Props:
```ts
interface Props {
  label: string;          // 'Data Access' | 'Performance'
  score: number | null;   // 0–100 or null when no data
  isRunning?: boolean;    // dim the gauge slightly while a run is in progress
}
```

Visual layout (≈110px wide × 90px tall per gauge):

```text
   ╭──────────╮
   │  ▁▂▃▄▅   │   ← half-donut arc (180°)
   │   78     │   ← big score number (or "—")
   ╰──────────╯
     Data Access
```

Implementation sketch:
```tsx
<RadialBarChart
  width={110}
  height={70}
  innerRadius="70%"
  outerRadius="100%"
  startAngle={180}
  endAngle={0}
  data={[{ value: score ?? 0, fill: arcColor }]}
>
  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
  <RadialBar background={{ fill: 'hsl(var(--muted))' }} dataKey="value" cornerRadius={6} />
</RadialBarChart>
```

The big number is a separate absolutely-positioned `<div>` overlaid in the gauge's center (using a `relative` wrapper) so it always reads the latest `score` prop, and the small label sits beneath. Use `tabular-nums` so the number doesn't shift width as it ticks up.

## 3. Wiring in `CompleteLayersDialog`

In the existing 3-column header grid, replace the empty `<div />` placeholder for column 3 with:

```tsx
<div className="flex items-start justify-end gap-3">
  <HealthcheckScoreGauge
    label="Data Access"
    score={computeDataAccessScore([...validationResults.values()])}
    isRunning={isValidating}
  />
  <HealthcheckScoreGauge
    label="Performance"
    score={computePerformanceScore([...validationResults.values()])}
    isRunning={isValidating}
  />
</div>
```

The gauges update live during a run because `validationResults` is the same Map already driving the live counter rows in the central Results card.

Both score values can be wrapped in a single `useMemo` keyed on `validationResults` to avoid recomputing on unrelated re-renders.

## 4. Styling notes
- Keep colors derived from the existing Tailwind tokens (`text-green-600`, `text-amber-600`, `text-red-600`) and `hsl(var(--muted))` for the empty arc background — no new CSS variables needed.
- Wrap each gauge in a small `<div className="flex flex-col items-center w-[110px]">` so labels stay aligned and the column doesn't reflow.
- Add `aria-label={`${label} score: ${score ?? 'not yet calculated'} out of 100`}` for screen readers.

## Out of scope
- No changes to the home-page Results card or to the Run/Re-run flow.
- No persistence of historical scores; the gauges always reflect the current `validationResults` Map.
- No tests added in this pass; helpers are pure and trivial to test later if desired.
