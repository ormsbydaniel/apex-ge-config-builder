

## Add Legend Editor Dialog

Add a pencil icon to the Legend sub-section header and a modal dialog for editing legend settings, following the same pattern as the RGB Composites and other editor dialogs.

### New File: `src/components/form/LegendEditorDialog.tsx`

A dialog component that allows editing legend configuration:
- **Legend type** selector: `swatch | gradient | image` (Select dropdown)
- **Conditional fields** based on type:
  - `image`: URL input field
  - `gradient`: Start/end color pickers, min/max value inputs (only when no colormaps exist)
  - `swatch`: No additional fields (references categories)
- Props: `legend` (current value), `meta` (for gradient colors/range), `onUpdateLegend` callback, `onUpdateMeta` callback
- Save button applies changes; cancel discards

The dialog will update both `layout.layerCard.legend` (type/url) and `meta` fields (startColor, endColor, min, max) as needed, mirroring the existing `LayerControlsSection` field set but in a modal context.

### Modified: `src/components/layers/components/LayerDataVisualisationSection.tsx`

- Import `LegendEditorDialog`
- Add pencil icon button next to the "Legend" label (same pattern as Categories/Colormaps/RGB)
- Wire the dialog with current legend and meta values
- Handle updates via a new handler that calls `onUpdateMeta` for gradient fields and dispatches layout changes for legend type/url

Since layout updates aren't currently exposed through `onUpdateMeta`, I need to check how layout updates work.

### Layout update path

Looking at `LayerCardContent.tsx` summary — it has `handleUpdateLayout`. The `LayerDataVisualisationSection` only receives `onUpdateMeta`. I'll need to add an `onUpdateLayout` prop to pass layout changes up.

### Changes summary:
1. **New file** `LegendEditorDialog.tsx` — modal with legend type selector + conditional fields
2. **Modified** `LayerDataVisualisationSection.tsx` — add pencil icon, import dialog, accept new `onUpdateLayout` prop
3. **Modified** `LayerCardContent.tsx` — pass `onUpdateLayout` to `LayerDataVisualisationSection`

