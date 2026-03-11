

## RGB Composites Editor Modal

### What it does

A new dialog opened from the pencil button on the RGB Composites sub-section. It allows the user to:

1. **Toggle `convertToRGB`** — a single checkbox, applied to all data sources in the layer
2. **Select exactly 3 bands for R, G, B** — using the same two-column checkbox + reorder list pattern from `BandSelectorDialog`, but constrained to exactly 3 bands and with R/G/B color indicators on the selected side

The modal reads the band count from the first COG data source (via `fetchCogHeaderMetadata`). Band labels from `source.meta?.bandLabels` are passed through if available.

### New file: `src/components/layers/components/RgbCompositeEditorDialog.tsx`

**Props:**
```typescript
interface RgbCompositeEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: DataSource;
  onUpdateDataSources: (updatedData: DataSourceItem[]) => void;
}
```

**Behavior:**
- On open, reads current state: checks if any data source has `convertToRGB: true`, reads `bands` from first such source (default `[1, 2, 3]`)
- Fetches `cogBandCount` from first COG source URL via `fetchCogHeaderMetadata`
- Shows a checkbox: "Enable RGB Composite rendering" (toggles `convertToRGB`)
- Below that, the two-column band selector (Available / Selected) reusing the same layout pattern as `BandSelectorDialog`:
  - Available column: unchecked bands, click to add (disabled if 3 already selected)
  - Selected column: up to 3 bands with drag reorder, color indicators (position 1 = Red, 2 = Green, 3 = Blue), up/down arrows
  - Max 3 bands enforced — selecting a 4th is blocked with a message
- On Save: iterates all data sources, sets `convertToRGB` and `bands` on each COG source

### Changes to `LayerDataVisualisationSection.tsx`

- Replace the placeholder "coming soon" `Dialog` with `<RgbCompositeEditorDialog>`
- Pass `source` and `onUpdateDataSources` props through
- Remove the inline dialog state (`rgbDialogOpen`) — the new component manages its own open state, or keep it and pass through

### Design notes

- The two-column layout, `SortableBandRow`, DnD context, and scroll areas follow the exact same pattern as `BandSelectorDialog` — adapted to enforce the 3-band limit and show R/G/B color dots next to each selected band position
- No "Apply to all" checkbox needed — this always applies to all data sources by default (as specified)

