# Align the multi-band editor headings

## Goal
Make the two-pane editor read as two aligned columns, for both spectral indices and composites, without changing any styling controls or saved data.

## Layout
- In the editor, place **Multi-band visualisations** at the top of the left column and the existing “Adjust bands and ranges. Changes apply to all COG sources in this layer.” text at the top of the right column as its header.
- Put **← Back to visualisations** directly beneath the left title.
- Start the two panes' content headings on the same horizontal line: **Spectral indices** opposite **Index value range**, or **Composite** opposite **Channel ranges**.
- Keep the left and right panels aligned even if the right-hand header wraps; preserve the current scrolling, divider, close control, and footer buttons. The gallery view retains its current title and description layout.

## Technical approach
- Adjust only the dialog's presentation structure in `RgbCompositeEditorDialog.tsx`: use the same column proportions for the editor header and body, and separate the aligned heading row from each pane's scrollable controls. Preserve all existing state, recipe selection, band and range behaviour, and saving logic.

## Verification
- Check both index and composite editors at the desktop preview width, including the initial gallery and an existing-style editor. Confirm the headings align and controls remain usable; review the preview build result.
