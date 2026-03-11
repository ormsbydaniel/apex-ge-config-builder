

## Extract Gradient into its own Data Visualisation modal

### Summary
Move the gradient configuration (colors, min/max) out of the Legend Editor Dialog into a new **Gradient Settings** modal, added as a new sub-section in the Data Visualisation section. The Legend Editor simplifies to just **Auto** and **Image** modes.

### Changes

**1. New file: `src/components/form/GradientEditorDialog.tsx`**
- A dialog with title "Gradient Settings" containing:
  - Start/End color pickers (hidden if colormaps exist, with info message)
  - Min/Max value inputs
  - Gradient preview
- Props: `open`, `onOpenChange`, `meta`, `onUpdateMeta`
- On save: writes `startColor`, `endColor`, `min`, `max` to meta
- Essentially the current gradient section from `LegendEditorDialog.tsx` extracted into its own dialog

**2. Update `src/components/form/LegendEditorDialog.tsx`**
- Remove `gradient` from the type dropdown — only `auto` and `image` remain
- Remove all gradient-related state (`startColor`, `endColor`, `minValue`, `maxValue`) and UI
- Remove gradient-related meta updates from `handleSave`
- Remove `onUpdateMeta` prop (no longer needed)
- Keep Auto info text and Image URL input as-is

**3. Update `src/components/layers/components/LayerDataVisualisationSection.tsx`**
- Add a new **Gradient** sub-section between RGB Composites and Legend (or after Colormaps — matching the existing pattern)
  - Icon: use a suitable icon (e.g. `Blend` or reuse `LayoutGrid` variant)
  - Shows gradient preview inline if `meta.startColor`/`meta.endColor` exist
  - Pencil button opens the new `GradientEditorDialog`
- Remove `onUpdateMeta` prop from `LegendEditorDialog` usage
- Remove `meta` prop from `LegendEditorDialog` usage (no longer needed)

### Order in Data Visualisation section
Categories → Colormaps → RGB Composites → **Gradient** → Legend

