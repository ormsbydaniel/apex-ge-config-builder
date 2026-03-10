

## Align Content Under Labels (Not Icons) Across All Layer Card Sections

The Description & Attribution section correctly uses `ml-6` to indent content beneath the label text. The other sections have their content flush left, aligning under the icon instead.

### Changes

Add `ml-6` to the content containers in these components:

1. **LayerControlsDisplay.tsx** — Add `ml-6` to the badges `div` (line 45)
2. **LayerCategories.tsx** — Add `ml-6` to the badges `div` (line 38)
3. **LayerFieldsDisplay.tsx** — Add `ml-6` to the content below the header
4. **LayerColormapsDisplay.tsx** — Add `ml-6` to the content below the header
5. **LayerLegendDisplay.tsx** — Add `ml-6` to legend content sections

This is a simple CSS-only change across 5 files, ensuring all section content aligns consistently beneath the label text, matching the Description & Attribution pattern.

