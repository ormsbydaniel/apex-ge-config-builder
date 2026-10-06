# Simplify the index editor: drop "Index value range"

## Why
With the new default palettes and the editable stop grid, "Index value range" is redundant and confusing: recipe and custom stops carry their own absolute values, so min/max has no effect on rendering in those modes. Its only remaining jobs are (a) stretching generic/legacy colour ramps and (b) seeding the initial stops when customising a generic ramp. Both can live inside Customise settings.

## What you will see
- The index editor right pane becomes, top to bottom:
  1. **Index colours** — gradient preview and labelled stop summary (unchanged).
  2. **Visible range** — two-handle mask slider, Min/Max boxes, Show all (unchanged).
  3. **Customise settings** — collapsible stop grid at the bottom (unchanged).
- The standalone **Index value range** section (gradient, Min/Max inputs, Reset range, preset row) is removed.
- Task presets that really set a visibility mask (Open water, Vegetation only, Urban / built-up, Burn scars, Dense canopy) move to a row of quick buttons inside **Visible range**. Picking one sets the mask (and the internal colour range); Show all / dragging the slider still overrides it.
- Ramp-only presets (Full range, Positive only, Balanced, Vegetation ramp, …) disappear from the default view — they only affected generic ramps.
- For **generic-mode styles only** (legacy saved layers, and Custom index before customising), Customise settings gains a compact "Colour ramp range" row: Min/Max inputs plus Full range / Positive only presets. Recipe and custom modes never show it.
- The footnote text is reworded to describe stops and the visible mask instead of min/max stretching.

## Not changing
- Saved JSON shape: `min`/`max` are still saved (legacy layers keep rendering exactly as today); unedited layers export byte-identically.
- Composites, the stop grid editing logic, visible-range masking behaviour, and per-dataset scope rules.

## Technical details
- `RgbCompositeEditorDialog.tsx` (index right pane): delete the value-range block (lines ~769–800); keep `indexMin`/`indexMax` state, the `indexMax > indexMin` part of `indexReady`, and the existing save path untouched.
- Preset row: filter `indexRangePresets(indexRecipe)` to presets that define `visibleMin`/`visibleMax`, render inside the Visible range section; `onClick` sets visible range (and internal min/max) as today.
- Generic-only control: when `indexPaletteMode === 'generic'`, render the compact Min/Max + FULL/POS preset row inside Customise settings (labelled "Colour ramp range"); `restoreIndexDefaults` continues to reset it.
- Update the section-order/labels in `docs/layers/rgb-composite.md` (Customise settings + Visible range wording).
- Tests: preset buttons set the visible mask; generic range inputs still produce a stretched generic ramp on save; legacy config round-trip unchanged; recipe/custom modes save without min/max-driven rendering changes.

## Verification
- Focused Vitest (indices + editor tests), typecheck, preview build.
- Playwright on the multispectral config: East London NDWI shows Index colours → Visible range → Customise settings with no value-range section; Open water preset applies the mask; Bristol Custom index shows the generic Colour ramp range inside Customise settings. Detailed UI testing stays with you.
