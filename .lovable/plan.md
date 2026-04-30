## Healthcheck card layout refinement

Restructure the Healthcheck section in `src/components/config/HomeTab.tsx` (lines ~574-630) into a two-column layout where the "Last run" nested card fills the right side.

### New layout

```text
┌─ Healthcheck ──────────────────────────────────────────────┐
│  ┌──────────────┐   ┌─ Last run ─────────────────────────┐ │
│  │     🩺       │   │ Ran: <timestamp>                   │ │
│  │   (icon)     │   │                                    │ │
│  │              │   │ Data Access      Performance       │ │
│  │ Full health  │   │  ✓ 8 Pass         ● 6 Good         │ │
│  │ check of all │   │  ◐ 1 Partial      ◐ 2 Average      │ │
│  │ layers...    │   │  ✗ 1 Fail         ○ 1 Poor         │ │
│  │              │   │                                    │ │
│  │ [Run Health] │   └────────────────────────────────────┘ │
│  └──────────────┘                                          │
└────────────────────────────────────────────────────────────┘
```

### Changes in `src/components/config/HomeTab.tsx`

1. Replace outer `flex items-start gap-4` row with `grid grid-cols-2 gap-4` (or `flex gap-4` with both children `flex-1`).

2. **Left column** — vertical stack, centered:
   - Stethoscope icon in its existing rounded badge.
   - Description paragraph ("Full health check of all layers for validity and performance.").
   - Run / Re-run Healthcheck button.
   - Use `flex flex-col items-center text-center gap-3` so the icon, text, and button align vertically.

3. **Right column** — the "Last run" nested `Card`:
   - Fills the column with `h-full` so it matches the left column height.
   - Clickable (`cursor-pointer hover:bg-muted/50 transition-colors`) to open `CompleteLayersDialog`.
   - Header row: "Last run" label + timestamp (omit timestamp if `LayerValidationResult` has no such field — verify via `code--view src/types/config.ts`).
   - Two-column `grid grid-cols-2 gap-4` body with sub-headings "Data Access" and "Performance".
   - Counts derived by mapping `Array.from(validationResults.values())` through `deriveHealthcheckColumns` from `src/utils/healthcheckColumns.ts`:
     - Data Access tally: `pass`, `partial`, `fail` (skip `na`).
     - Performance tally: `good`, `average`, `poor` (skip `na`).
   - Render each row as `<icon> <count> <label>` using existing `dataAccessLabel` / `performanceLabel` maps with colors:
     - Pass / Good → `text-green-600`
     - Partial / Average → `text-amber-600`
     - Fail / Poor → `text-red-600`

4. When `validationResults.size === 0`, the right column shows a muted placeholder card with italic "Not run yet." instead of the summary, keeping the two-column layout intact.

### Files touched

- `src/components/config/HomeTab.tsx` (only)

No schema, type, or helper changes needed — `deriveHealthcheckColumns`, `dataAccessLabel`, and `performanceLabel` already exist.
