# Move filters into column headers

Replace the standalone filter checkbox row with compact "Sort by ▾" and "Filter by ▾" header controls inside the **Data Access** and **Performance** columns of the healthcheck table.

## File to edit
`src/components/config/CompleteLayersDialog.tsx`

## Changes

### 1. Remove the existing filter row
Delete the `<div className="flex items-start gap-6 flex-wrap">…</div>` block (lines ~327–344) and the `FilterCheckbox` helper component (lines ~498–508). The `Filter` icon import and `Checkbox`/`Label` imports become unused — remove them. Keep the Healthcheck Summary card above.

### 2. Restructure the column headers
For both `Data Access` and `Performance` `<TableHead>`s, render a stacked layout:

```text
Data Access
[Sort by ▾]  [Filter by ▾]
```

Each control is a small `DropdownMenu` trigger (ghost button, `h-6 px-2 text-xs`) using the existing `DropdownMenu` primitives from `@/components/ui/dropdown-menu`.

### 3. Sort dropdown (per column)
Add new state: `sortBy: 'none' | 'dataAccess' | 'performance'` and `sortDir: 'asc' | 'desc'`.

Each column's "Sort by" menu offers:
- Default order
- Worst first (fail/poor → partial/average → pass/good → na)
- Best first (reverse)

Selecting a sort option in one column clears any sort set on the other column (single active sort). Apply the sort inside the existing `sortedLayers` `useMemo` after the current group/index ordering, ranking by the selected column's status using a numeric weight map.

### 4. Filter dropdown (per column)
Reuse the existing `showPass / showPartial / showFail` and `showGood / showAverage / showPoor` state. Each column's "Filter by" dropdown contains menu items with a checkmark indicator next to active values:
- Data Access: Pass, Partial, Fail
- Performance: Good, Average, Poor

Use `DropdownMenuCheckboxItem` so multiple values can be toggled while the menu stays open. The trigger label shows "Filter by" plus a small count badge (e.g. `Filter by (2)`) when not all options are selected, so users can see a filter is active.

The existing `filteredLayers` `useMemo` keeps working unchanged.

### 5. Layout detail
Header cell layout:

```tsx
<TableHead className="w-[180px]">
  <div className="flex flex-col gap-1">
    <span>Data Access</span>
    <div className="flex items-center gap-1">
      <SortMenu column="dataAccess" />
      <FilterMenu column="dataAccess" />
    </div>
  </div>
</TableHead>
```

Bump `Data Access` width from `w-[160px]` to `w-[180px]` and `Performance` from `w-[140px]` to `w-[170px]` to fit the two compact triggers without wrapping.

## Out of scope
- No change to the validation/run logic.
- No change to the Healthcheck Summary card or the row body rendering.
- No change to the `HomeTab` summary card.
