# Clarify channel stretch controls in the multi-band editor

## Goal
Give the histograms more room and make it obvious which contrast-stretch rule is active on each composite band, including mixed settings.

## Layout
- Remove the right-hand header description (“Adjust bands and ranges for the selected dataset.”). Keep the dialog title and Back link on the left, without reserving an aligned header row on the right.
- Let the right pane begin with **Channel ranges** on its first line, followed immediately by the existing **Contrast stretch (all bands)** control and then the histograms. Preserve the dataset selector, scrolling, divider, footer and index editor controls.

## Stretch feedback
- Selecting a method in the all-bands dropdown applies it to all three bands and emphasises that method's button beneath each histogram.
- Selecting a different method beneath one histogram changes and emphasises only that band's button. The other two retain their emphasis; the all-bands dropdown reads **Custom** while the three choices differ.
- Manual min/max or histogram-handle edits remove that band's method emphasis and make the dropdown **Custom**. When all three bands again use the same selected method, show that method in the dropdown.
- Do not guess an active method for an existing saved style when reopening: saved ranges do not record the method. Keep saved ranges intact and show Custom until the user explicitly selects a rule; on band or recipe changes, update the affected button states alongside the existing re-stretch behaviour.

## Technical approach
- In `RgbCompositeEditorDialog.tsx`, simplify the editor header and keep the right-pane heading at the top of its scrollable content. Track the selected stretch method per RGB channel, alongside the existing min/max and pending histogram work; derive the dropdown's shared-versus-Custom display from those three choices. Keep the existing range calculations, per-dataset batch action and saving format unchanged.
- In `BandHistogram.tsx`, let each supplied stretch option expose its active state and render its button with the existing design-system selected variant. No change to other histogram callers' fallback buttons.

## Verification
- Focused tests for all-bands selection, one-band override, manual edit and reopening saved ranges; check a composite with mixed methods and the unchanged index view in the preview. Review build diagnostics. Detailed UI testing remains with you.
