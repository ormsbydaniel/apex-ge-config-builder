

## Band Selector with Dual-List Component

### What
Replace the current bands badge with a clickable badge (with COG icon) that opens a dual-list transfer dialog. Users pick bands from "Available" on the left, transfer them to "Selected" on the right, reorder selected bands, and optionally apply to all COGs in the layer.

### New Component: `src/components/layers/components/BandSelectorDialog.tsx`

A dialog containing a dual-list transfer UI:

```text
Available Bands          Selected Bands
┌───────────────┐       ┌───────────────┐
│ Band 1        │   >   │ Band 3        │  ▲
│ Band 2        │  >>   │ Band 5        │  ▼
│ Band 4        │   <   │               │
│ Band 6        │  <<   │               │
└───────────────┘       └───────────────┘
☐ Apply to all COG sources in this layer
```

- **Props**: `open`, `onOpenChange`, `cogBandCount`, `currentBands: number[]`, `onSave: (bands: number[], applyToAll: boolean) => void`, `cogCount: number`, `bandLabels?: string[]`
- **Left list**: All bands not currently selected (1 through `cogBandCount`), with click-to-highlight selection
- **Center buttons**: `>` (move selected right), `>>` (move all right), `<` (move selected left), `<<` (move all left)
- **Right list**: Currently selected bands in configured order, with click-to-highlight selection
- **Up/Down buttons** on the right side to reorder selected bands
- **"Apply to all COGs" checkbox** shown only when `cogCount > 1`
- Band labels displayed alongside numbers if available (e.g., "Band 3 (Red)")
- No external dependencies needed — pure React with existing UI primitives (Button, Checkbox, Dialog, ScrollArea)

### Update: `DataSourceItem.tsx`
- Add `Layers` icon from lucide inside both bands badges
- Make badges clickable (open `BandSelectorDialog`)
- New props: `onUpdateBands?: (bands: number[], applyToAll: boolean) => void`, `cogCount?: number`

### Prop Propagation Chain
Add `onUpdateDataBands` callback through:
- `DataSourceDisplay.tsx` → new prop, passes `(dataIndex, bands, applyToAll)` up
- `DataSourcesTab.tsx` → passes through
- `LayerCardTabs.tsx` → passes through  
- `LayerCardContent.tsx` → implements the update logic:
  - If `applyToAll`: update `bands` on every COG in `source.data`
  - Otherwise: update only the targeted data source item
  - Dispatch via `UPDATE_SOURCE`

Also pass `cogCount` (count of COG items in `source.data`) down the same chain so the dialog knows whether to show the "apply to all" checkbox.

