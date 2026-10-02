# Clarify channel stretch controls in the multi-band editor

## Goal
Give the histograms more room and make it obvious which contrast-stretch rule is active on each composite band, including mixed settings.

## Layout
- Replace the right-hand header description (“Adjust bands and ranges for the selected dataset.”) with **Channel ranges** on the top line opposite the dialog title. Remove the second **Channel ranges** heading currently aligned with **Composite** below the dataset selector.
- Start the right-hand scrollable controls with **Contrast stretch (all bands)**, followed by the histograms. This gives back the vertical space shown in the screenshot without forcing the right-hand controls to line up with the lower **Composite** heading. Keep the dataset selector, scrolling, divider, footer and index editor controls.

## Stretch feedback
- Selecting a method in the all-bands dropdown applies it to all three bands and emphasises that method's button beneath each histogram.
- Selecting a different method beneath one histogram changes and emphasises only that band's button. The other two retain their emphasis; the all-bands dropdown reads **Custom** while the three choices differ.
- Manual min/max or histogram-handle edits remove that band's method emphasis and make the dropdown **Custom**. When all three bands again use the same selected method, show that method in the dropdown.
- Do not guess an active method for an existing saved style when reopening: saved ranges do not record the method. Keep saved ranges intact and show Custom until the user explicitly selects a rule; on band or recipe changes, update the affected button states alongside the existing re-stretch behaviour.

## Technical approach
- In `RgbCompositeEditorDialog.tsx`, put the composite's right-pane heading in the existing header's right column and remove its duplicate in the scrollable content. Keep the index editor's own heading as appropriate. Track the selected stretch method per RGB channel, alongside the existing min/max and pending histogram work; derive the dropdown's shared-versus-Custom display from those three choices. Keep the existing range calculations, per-dataset batch action and saving format unchanged.
- In `BandHistogram.tsx`, let each supplied stretch option expose its active state and render its button with the existing design-system selected variant. No change to other histogram callers' fallback buttons.

## Verification
- Focused tests for all-bands selection, one-band override, manual edit and reopening saved ranges; check a composite with mixed methods and the unchanged index view in the preview. Review build diagnostics. Detailed UI testing remains with you.
