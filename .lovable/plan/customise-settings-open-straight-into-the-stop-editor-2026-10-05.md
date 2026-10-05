# Customise settings: open straight into the stop editor

## Why
Today, expanding **Customise settings** for a recipe-palette index still shows a **Customise colour stops** button, and only a second click reveals the stop grid. That extra click adds no information — the editor should appear as soon as the section is expanded.

## Behaviour
- Expanding **Customise settings** immediately shows the stop editor (named-ramp selector, Reverse, `IndexStopsEditor` grid) — for recipe palettes, custom palettes and generic/legacy ramps alike. The button is removed.
- Peeking is free: simply expanding the section does **not** change the saved style. The style only becomes a custom palette when the user actually edits a stop, applies a named ramp, or toggles Reverse — at that point the current stops are cloned into the editable custom copy (existing `beginCustomising` behaviour, driven by the first edit instead of the button).
- While unedited, the editor displays the recipe's default stops (or, for generic mode, the current generic ramp converted to stops) and Save continues to export `paletteMode: "recipe"` / generic exactly as today.
- **Restore [INDEX] defaults** keeps working: it resets to the recipe palette (or default generic ramp) and the editor now shows those restored stops, again only becoming custom on the next edit.
- The generic-mode **Colour ramp range** row (Min/Max + Full range / Positive only) stays at the top of the section for legacy/custom-index styles, unchanged.

## Technical changes
- `src/components/layers/components/RgbCompositeEditorDialog.tsx` (index right pane, `details` block ~lines 811–884):
  - Delete the `indexPaletteMode !== 'custom'` button branch; always render the named-ramp row and `IndexStopsEditor`.
  - Compute the editor's stops as `customIndexStops` when in custom mode, otherwise the active recipe stops, or `genericLegendStops(...)` for generic mode (same source `beginCustomising` uses today).
  - Replace the direct `onChange={setCustomIndexStops}` with a wrapper that, when the mode is not yet `'custom'`, clones the edited list into `customIndexStops` and sets `indexPaletteMode: 'custom'` on that first change (never mutating the shared recipe definition).
  - Fix `applyNamedRamp`'s fallback base to use the active stops (recipe stops) rather than only `customIndexStops`/generic, so applying a ramp from recipe mode preserves recipe values and meanings.
  - The `details` element's default-open rule (custom mode or no recipe palette) is unchanged.
- `docs/layers/rgb-composite.md`: reword the "Index-specific colours" paragraph so it no longer implies an extra click (expand → edit directly); no behavioural wording changes elsewhere.

## Verification
- Editor-level test: expanding the section shows the stop grid without clicking a button; editing a value/colour switches the saved style to custom mode with cloned stops; saving without edits still exports `paletteMode: "recipe"`.
- Re-run focused index tests, typecheck, and preview build; spot-check in Playwright on the multispectral config (Bristol NDVI: expand → editor visible; edit → Save/reopen shows custom stops; Restore defaults → recipe mode).
