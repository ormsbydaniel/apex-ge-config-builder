

## Per-Band Histogram in Advanced Settings

### Concept

When the user clicks a channel row (R, G, or B) in the Advanced Settings panel, the dialog widens and shows a large histogram for that band alongside the min/max inputs. Only one band's histogram is shown at a time.

### Layout

```text
┌─────────────────────────────────────────────────────────┐
│ RGB Composite Editor                                     │
├──────────────────────┬──────────────────────────────────┤
│  ← Back              │                                  │
│                      │   Band 4 – Red Channel           │
│  [R] Band 4  ← ●    │   ┌──────────────────────────┐   │
│  [G] Band 2         │   │                          │   │
│  [B] Band 7         │   │    ▐▐▐█▐▐▐▐▐            │   │
│                      │   │   ▐▐▐████▐▐▐▐           │   │
│                      │   │  ▐▐▐██████▐▐▐▐▐         │   │
│                      │   │ ▐▐▐████████▐▐▐▐▐▐       │   │
│                      │   └──────────────────────────┘   │
│                      │   Min: [____]   Max: [____]      │
│                      │   ↑ data range: 234 – 8901       │
├──────────────────────┴──────────────────────────────────┤
│                              [Cancel]  [Save]            │
└─────────────────────────────────────────────────────────┘
```

- Left side: compact channel list (R/G/B rows). Clicking a row selects it for histogram display. The active row is highlighted.
- Right side: a tall Recharts `BarChart` histogram (~300px height) for the selected band, plus min/max inputs below it.
- When no band is selected for refinement, the right panel shows a prompt ("Click a channel to view its pixel distribution").
- Dialog width expands from `sm:max-w-[600px]` to `sm:max-w-[850px]` when in advanced mode.

### Implementation

**New utility: `fetchBandHistogram`** in `src/utils/cogMetadata.ts`
- Reuses the existing pattern from `fetchCogBandStatistics`: find best overview, read rasters with timeout/abort, stride sampling.
- Buckets sampled values into ~50 bins, returns `{ bins: { x: number; count: number }[]; min: number; max: number }`.
- Skips noData values.

**New component: `BandHistogram.tsx`** in `src/components/layers/components/`
- Props: `data`, `loading`, `error`, `channelColor`, `minMax`, `onMinMaxChange`
- Renders a Recharts `BarChart` with bars colored by the channel color. Bars outside the min/max range are dimmed/grayed.
- Min/max number inputs below the chart.
- Shows the data's actual min/max range as helper text.

**Updates to `RgbCompositeEditorDialog.tsx`**
- New state: `activeChannel: number | null` (0/1/2), `histogramData: Record<number, { bins, min, max } | null>`, `histogramLoading: Record<number, boolean>`.
- When a channel row is clicked, fetch histogram for that band (cached if already fetched). Set `activeChannel`.
- Advanced panel switches to a two-column layout: narrow channel list on the left, histogram + inputs on the right.
- Dialog class conditionally uses wider max-width when `showAdvanced` is true.
- Auto-populate min/max from histogram data range when first loaded (if still at defaults).

### Files to modify
- **`src/utils/cogMetadata.ts`** — Add `fetchBandHistogram()` 
- **`src/components/layers/components/BandHistogram.tsx`** — New component
- **`src/components/layers/components/RgbCompositeEditorDialog.tsx`** — Wider dialog, channel selector, histogram integration

