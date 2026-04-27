## Add Chart Subtitle Input Field

### Overview
Add a "Chart Sub-title" text input field directly beneath the existing "Chart Title" input in the Chart Source form. The `subtitle` field already exists in the `ChartConfig` type and is supported in the exported JSON.

### Changes Required

#### 1. `src/components/layers/components/ChartSourceForm.tsx`

**Add state for subtitle:**
- Add `const [chartSubtitle, setChartSubtitle] = useState(editingChart?.subtitle || '');` alongside the existing `chartTitle` state.

**Add input field below Chart Title:**
- Insert a new input block directly beneath the existing "Chart Title" section (around line 613):
  ```
  <div className="space-y-2">
    <Label htmlFor="chartSubtitle">Chart Sub-title (optional)</Label>
    <Input
      id="chartSubtitle"
      value={chartSubtitle}
      onChange={(e) => setChartSubtitle(e.target.value)}
      placeholder="Enter chart sub-title"
    />
  </div>
  ```

**Include subtitle in final config on submit:**
- In both the `pixelValues` and CSV submit paths, include `...(chartSubtitle.trim() && { subtitle: chartSubtitle.trim() })` when building the `finalConfig` object, alongside the existing `chartTitle` spread.

**Sync subtitle when editingChart changes:**
- In the `useEffect` that syncs form state with `editingChart`, add `setChartSubtitle(editingChart?.subtitle || '');`.

### Technical Details
- The `ChartConfig` interface in `src/types/chart.ts` already defines `subtitle?: string` (line 121).
- No schema changes are needed since `subtitle` is already part of the type system.
- The exported JSON will automatically include the subtitle field when present.