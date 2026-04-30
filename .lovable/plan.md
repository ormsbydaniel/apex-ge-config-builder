## Goal

In the Healthcheck modal:
1. Remove "View details" for layers whose Data Access is Pass AND Performance is Good (or N/A) — keep it only where there is something useful to investigate.
2. Make the metrics in the Results card clickable as a single "quick filter", with mutual exclusivity across the two metric groups.

---

## 1. Hide "View details" when there's nothing to investigate

In `src/components/config/CompleteLayersDialog.tsx` (around line 528), the toggle button currently renders whenever `hasUrlResults` is truthy.

Change the condition so the button only renders when the layer has at least one non-good signal:

- Show details button when ANY of:
  - `cols.dataAccess` is `partial` or `fail`
  - `cols.performance` is `average` or `poor`
- Otherwise (Pass + Good, or Pass + N/A), hide the button entirely so the cell is empty.

This keeps the technical info available exactly where it's useful and removes clutter from the rows that "just work".

---

## 2. Clickable summary metrics as a single mutually-exclusive filter

### New behaviour

The six rows in the Results card (Pass / Partial / Fail and Good / Average / Poor) become clickable chips.

Filter rules:
- At most ONE quick filter is active at a time across both metric groups.
- Clicking a metric (e.g. Performance → Poor):
  - Filters the table to rows where Performance = Poor
  - Leaves Data Access unfiltered (ALL data access outcomes shown)
- Clicking a different metric (e.g. Data Access → Fail) replaces the previous one:
  - Filters to rows where Data Access = Fail
  - Leaves Performance unfiltered
- Clicking the currently active metric again clears the filter (toggle off).

The active chip gets a visible "selected" styling (e.g. ring + slightly bolder background). Other chips stay clickable but un-highlighted.

### Interaction with the existing per-column filter dropdowns

The column header filter dropdowns (Pass/Partial/Fail and Good/Average/Poor checkboxes) stay as they are — they are the "advanced" multi-select path. To keep the model simple:
- The new quick filter is a separate, single-value state (e.g. `quickFilter: { kind: 'dataAccess' | 'performance', value: ... } | null`).
- Setting a quick filter resets the corresponding column's checkbox filter to "all checked" so the two systems don't fight.
- Manually changing a checkbox in the column dropdown clears any active quick filter on that same column.
- The other column's checkbox filters are left alone.

### Filter logic

In the `filteredLayers` memo, after the existing checkbox-based `daOk` / `perfOk` checks, additionally apply the quick filter:
- If `quickFilter.kind === 'dataAccess'`, keep the row only when its derived `dataAccess` equals `quickFilter.value`.
- If `quickFilter.kind === 'performance'`, keep the row only when its derived `performance` equals `quickFilter.value`.
- Rows still validating (no result yet) continue to be shown so users can watch progress.

### Visual

Each summary line (e.g. the `Check` icon + count + "Pass" label) becomes a `<button>` with:
- Full-width clickable area, left-aligned content matching today's layout.
- Hover: subtle muted background.
- Active (selected): `ring-1 ring-primary/40` + `bg-primary/5`, count text bolded.
- A small "Clear" affordance is unnecessary — clicking the active chip again clears it; we'll add a tooltip on hover ("Click to filter / Click again to clear").

Counts continue to reflect the full validation results (they are not affected by the active quick filter), so the user always sees totals.

---

## Files to edit

- `src/components/config/CompleteLayersDialog.tsx`
  - Add `quickFilter` state (`{ kind: 'dataAccess' | 'performance'; value: DataAccessStatus | PerformanceStatus } | null`).
  - Extract the six summary lines into a small local `SummaryChip` component (kept inside the file, consistent with existing local components).
  - Wire each chip's `onClick` to toggle/replace `quickFilter` and reset the relevant column's checkbox filters to all-on.
  - Wrap the existing checkbox `onChange` handlers so manual changes clear `quickFilter` if it targets that same column.
  - Extend the `filteredLayers` memo to apply `quickFilter`.
  - Tighten the "View details" render condition as described in section 1.

No schema, types, or other components are affected.
