

## Move Legend to its own top-level section

### Changes

**1. New file: `src/components/layers/components/LayerLegendSection.tsx`**
- A new section component at the same level as Data Visualisation, with `LayoutGrid` icon and "Legend" title.
- Below the header, show the current legend status:
  - No legend: "(None)" italic
  - `type === 'image'`: "Image" + existing URL link
  - `type === 'gradient'`: "Auto (from gradient)"
  - `type === 'swatch'`: Derive label from active vis type — "Auto (from categories)" if categories exist, "Auto (from colormaps)" if colormaps exist, otherwise just "Auto"
- Pencil button to open `LegendEditorDialog`
- Contains the `LegendEditorDialog` and its `onUpdateLegend` logic (moved from DataVisualisationSection)
- Props: `source`, `onUpdateLayout`, `activeVisType` (passed from parent so it knows what's active)

**2. Update `LayerDataVisualisationSection.tsx`**
- Remove the entire Legend sub-section (lines 289-348): state, dialog, imports (`LegendEditorDialog`, `ExternalLink`, `Image`, `LayoutGrid`)
- Remove `onUpdateLayout` from props (no longer needed here) and the interface
- Export `activeVisType` concept — actually simpler: just remove legend, keep props as-is minus `onUpdateLayout`

**3. Update `LayerCardContent.tsx`**
- Import `LayerLegendSection`
- Add it right after `LayerDataVisualisationSection`
- Pass `source`, `onUpdateLayout={handleUpdateLayout}`, and the active vis type info (or let the new component derive it itself from `source`)

**4. Update `LegendEditorDialog.tsx`**
- Change the resolved type from `'swatch'` to keep using `'swatch'` internally (for backward compat) but no user-facing "swatch" text — this is handled in the display component

### Legend status text logic
```
if no legend → "(None)"
if legend.type === 'image' → "Image"  
if legend.type === 'swatch' or 'gradient' →
  hasCategories ? "Auto (from categories)" :
  hasColormaps ? "Auto (from colormaps)" :
  hasGradient ? "Auto (from gradient)" :
  "Auto"
```

