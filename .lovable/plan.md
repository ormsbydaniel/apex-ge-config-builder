# Live Results card in Healthcheck modal

Replace the current blue "Checking layers…" progress strip and the muted "Healthcheck Summary" line in `CompleteLayersDialog` with a single Results card at the top of the modal that mirrors the layout of the home page's Results sub-card. While a run is in progress, the card's counters tick up live and the card additionally shows the name of the layer currently being checked plus an `n / total` progress label.

## File
`src/components/config/CompleteLayersDialog.tsx`

## Changes

### 1. Imports
- Add `Card, CardContent` from `@/components/ui/card`.
- Add `CircleDot, CircleDashed` to the existing `lucide-react` import (already importing `Check`, `XCircle`).

### 2. Remove existing blocks
Delete the two blocks currently rendered above the table (~lines 351–385):
- The `{isValidating && (...)}` blue progress strip.
- The `{validationResults.size > 0 && (...)}` "Healthcheck Summary" muted box.

### 3. New `<LiveResultsCard />` rendered above the table
Insert a single card whose visibility is `isValidating || validationResults.size > 0`. The card contains:

```text
RESULTS                                        Checking 3 / 12  ⟳
                                               Currently: <layer name>
─────────────────────────────────────────────────
Data Access            │  Performance
✓ 8 Pass               │  ● 7 Good
◌ 1 Partial            │  ◌ 1 Average
✕ 0 Fail               │  ✕ 0 Poor
```

Layout details:
- Card styling: `border-border/50 bg-background/60 max-w-md ml-auto mb-4` so it sits at the **top right** of the modal body.
- Inner `CardContent` `p-3 space-y-3`.
- Header row (`flex items-center justify-between gap-2`):
  - Left: small uppercase "RESULTS" label (`text-xs font-semibold text-foreground/80 uppercase tracking-wide`).
  - Right (only when `isValidating`): `Checking {completed} / {total}` plus `<Loader2 className="h-3.5 w-3.5 animate-spin" />`.
- Currently-checking line: when `isValidating && validationProgress.currentLayer`, render a single muted line `Currently: <name>` with `truncate` so a long name doesn't break the card.
- Two-column counter grid identical to the home Results card, using the existing `summary` memo for counts and the same icon mapping:
  - Data Access: `Check` (green) Pass, `CircleDashed` (amber) Partial, `XCircle` (red) Fail.
  - Performance: `CircleDot` (green) Good, `CircleDashed` (amber) Average, `XCircle` (red) Poor.

Counts come from the existing `summary` `useMemo`, which is already updated incrementally as each layer's result lands in `validationResults` via `onLayerResult` — so the counters tick up live during a run with no extra plumbing.

### 4. Wiring (no other changes required)
- `validationProgress` (already maintained) provides `completed`, `total`, and `currentLayer`.
- `summary` (already memoized from `validationResults`) provides the per-status counts.
- The existing `setValidationProgress(p => ({ ...p, completed: p.completed + 1 }))` call in `handleRunDetailedReport` should be verified to actually run after each layer (it's currently inside the loop / `onLayerResult` flow — confirm during implementation and add `completed` increment in `onLayerResult` if it isn't already wired).

### 5. Out of scope
- No changes to validation logic, table rendering, sort/filter headers, or the home-page Results card.
- The bottom "Last run" timestamp on the home card is unaffected.
