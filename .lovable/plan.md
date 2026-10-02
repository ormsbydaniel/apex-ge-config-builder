# Align the multi-band editor around the dataset controls

## What will change
- Put “← Back to visualisations” directly beneath “Multi-band visualisations” at the left, rather than centered across the dialog.
- For layers with several COGs, keep the dataset picker and its status/actions at the top of the **left pane**, above “Composite” or “Spectral indices”. Start the **right pane immediately** with “Contrast stretch (all bands)” for composites, or its existing index controls for spectral indices. The right pane must not wait for the dataset controls to finish; its top is independent of the “Composite” label.
- For single-COG layers, keep the dataset picker hidden and start both panes immediately below the title/back-link area. Preserve the existing controls, scrolling, footer, and save behaviour.

## UI verification
- Load the “Multispectral datasets” test configuration from Test & development. Open Bristol Sentinel 2 (single COG) and East London time series natural colour (multiple COGs); compare screenshots and measured top positions of the editor panes after band information has loaded.
- On East London, step to another dataset and confirm that the left-pane selector changes the displayed settings without shifting the right-pane top. Also check the index editor and a narrower viewport for readable layout, usable scrolling, and unobstructed controls. Run the focused editor tests and check the preview diagnostics.

## Technical approach
- Reorganise only the layout in `RgbCompositeEditorDialog.tsx`: move the current multi-dataset control into the left scroll area, make the two panes share a top edge regardless of dataset count, and left-align the back link under the title. Reuse existing handlers and state; do not change per-dataset application, stretch calculations, schema, or exported JSON.
