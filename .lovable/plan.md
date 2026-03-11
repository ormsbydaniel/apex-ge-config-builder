

## Refine Legend Editor Dialog — Auto, Image, Gradient

### What changes

**Dropdown options**: Replace `swatch | gradient | image` with `auto | image | gradient`.

**Auto logic on save**: When "Auto" is selected, resolve the stored `legend.type` based on layer state:
- If categories exist on the layer → store `legend.type = 'swatch'`
- Otherwise → store `legend.type = 'swatch'` as default (extensible later when more rules are defined)

The dropdown selection itself uses `'auto' | 'image' | 'gradient'` but the **saved** value maps `auto` → resolved type. No new type values are persisted — existing consumers (`swatch | gradient | image`) remain unchanged.

**UI when Auto is selected**: Show a brief hint explaining the auto-resolution (e.g., "Legend type will be determined automatically based on layer configuration").

### File: `src/components/form/LegendEditorDialog.tsx`

1. Change the local state type to `'auto' | 'image' | 'gradient'`
2. Update the `useEffect` reset: map incoming `legend?.type === 'swatch'` → `'auto'` (since swatch is now the auto-resolved output, not a direct selection)
3. Replace dropdown `SelectItem`s with Auto, Image, Gradient
4. On save: resolve `auto` → `swatch` (if categories) or `swatch` (default), then pass to `onUpdateLegend`
5. Replace the swatch info text with an auto info text
6. Keep Image URL and Gradient sections as-is (conditional on their respective types)

### Props type update
The `legend` prop type and `onUpdateLegend` callback keep using `'swatch' | 'gradient' | 'image'` — no change needed since we resolve before saving.

