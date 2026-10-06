# Clarify dataset scope and contrast stretch in Multi-band visualisations

## Goal
Make it immediately clear which dataset is being edited and which controls affect its appearance, without changing how settings are calculated, saved, or applied.

## Layout
- In the editor, put Previous / dataset selector / Next at the **top of the left pane**, before the Composite or Spectral indices recipe list. Keep the status badge (First dataset, Same as first, Own settings, or Per-dataset stretch), Reset to same as first, and Copy to all beside or directly beneath it. Show this group only for layers with multiple COGs.
- Keep the dialog title and Back to visualisations above the panes. Simplify the right-hand header to a brief description of the editor rather than placing the dataset selector there. Keep the gallery unchanged.
- For composites, move **Contrast stretch (all bands)** and its method dropdown from the left pane to the right pane, directly below **Channel ranges** and above the three histograms. Keep Compute stretch per dataset and its progress/error message grouped with that dropdown; its label and explanation should distinguish the batch action from ordinary edits to the selected dataset.
- For spectral indices, keep the Index value range controls in the right pane; the same left-pane dataset selector applies to their recipe, bands, colour ramp, and range.
- Keep headings, divider, scrolling, footer, and narrow-screen usability intact.

## Technical approach
- Reposition existing editor JSX in `RgbCompositeEditorDialog.tsx`, retaining its current handlers and state. Do not change per-dataset save, batch calculation, reset, copy-to-all, or schema behaviour.

## Verification
- Check that both composite and index editors show the selected dataset clearly and keep all controls usable for multi-COG and single-COG layers. Check the batch control's visibility and copy, and run the focused existing tests plus preview build diagnostics. Detailed UI testing remains with you.
