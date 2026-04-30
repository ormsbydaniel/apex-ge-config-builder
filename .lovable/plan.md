## Step 1: UI refresh for the QA panel

All changes are confined to `src/components/config/HomeTab.tsx`.

### 1. Rename the panel

- Change the `CardTitle` on line 519 from `Layer QA` to `Config QA`.
- Update the layout comment on lines 300 and 516 to say "Config QA".

### 2. Restructure the Config QA card

Currently the card contains: 5 stat cards in a row, then the "Run Data Source Validation" button, then a results summary panel. We will:

- Keep the 5 QA stat cards at the top (Complete, Missing Legend, Missing Attribution, No Data/Statistics, Performance Warning) — unchanged.
- Remove the `Button` (lines 572–579) and the "Last Validation Results" summary `button` (lines 582–604) from inside the Config QA card.
- Add a new section heading **"Healthcheck"** below the stats grid.
- Below the heading, render a new full-width healthcheck card.

### 3. New Healthcheck card

A nested card spanning the full width of the Config QA panel containing:

```text
┌─────────────────────────────────────────────────────────────┐
│ [stethoscope]  Full health check of all layers for          │
│                validity and performance.                    │
│                                                             │
│                Last run: 3 valid · 1 perf warning · 0 errors│
│                                          [ Run Healthcheck ]│
└─────────────────────────────────────────────────────────────┘
```

Implementation details:

- Use the `Stethoscope` icon from `lucide-react` (already exported by lucide). Render it large (≈`h-8 w-8`) inside a soft tinted circular background (e.g. `bg-primary/10 text-primary`) on the left.
- To the right: a short paragraph in `text-sm text-muted-foreground`: *"Full health check of all layers for validity and performance."*
- When `validationResults.size > 0`, show the existing summary chips (Valid / Perf warning / Partial / Errors) as a compact row below the description; the whole chips row remains clickable and opens `CompleteLayersDialog` (preserving current behavior). When there are no results yet, show a subtle "Not run yet" hint instead.
- A primary `Button` on the right labelled **"Run Healthcheck"** (or **"Re-run Healthcheck"** when `validationResults.size > 0`) that opens `CompleteLayersDialog` (`setShowCompleteLayersDialog(true)`), keeping all existing handlers and state.

Layout: outer container `Card` (or a styled `div` with `rounded-lg border bg-card/50 p-4`) using a flex row (`flex items-start gap-4`) so the icon, text block, and button align cleanly on desktop, wrapping gracefully on narrow widths.

### 4. Out of scope (explicitly deferred)

- No changes to `CompleteLayersDialog.tsx` in this step — the modal refinements come next.
- No changes to validation logic, probes, or data flow.
- No new types or schema changes.

### Files touched

- `src/components/config/HomeTab.tsx` — rename heading, restructure Config QA card content, add Healthcheck section + card, import `Stethoscope` icon.
