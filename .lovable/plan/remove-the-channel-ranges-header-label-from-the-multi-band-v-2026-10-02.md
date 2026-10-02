# Remove the "Channel ranges" header label from the Multi-band visualisations editor

## What changes

The editor header currently reserves a right-hand column that shows only a grey "CHANNEL RANGES" label. Since the right panel already starts with "Contrast stretch (all bands)" directly above the histograms, the label is redundant. Remove it so the header is just the dialog title with the "← Back to visualisations" link beneath it, maximising vertical space for the histograms.

## Edits (all in `src/components/layers/components/RgbCompositeEditorDialog.tsx`)

1. **Header:** replace the two-column `DialogHeader` grid (title left, "Channel ranges" label right, empty placeholder for the index editor) with the simple single-column header the gallery view already uses:
   - `<DialogTitle>Multi-band visualisations</DialogTitle>`
   - "← Back to visualisations" link button below the title.
   - No right-hand column, no border divider, for both composite and index editors.

2. **Right panel:** no change — it already begins with "Contrast stretch (all bands)", the stretch method dropdown, "Compute stretch per dataset" (multi-dataset layers), then the stacked channel histograms.

## Explicitly unchanged

- Index editor layout and its "Index value range" controls.
- Dataset selector (top of left pane), status badge, Reset / Copy to all.
- Per-band stretch emphasis, Custom dropdown logic, batch compute, saving format, per-dataset scope behaviour.
- Dialog width/height, footer buttons, scrolling and divider between panes.

## Verification

- Focused tests (`bunx vitest` on the editor/recipes test files) and typecheck (`bunx tsgo --noEmit -p tsconfig.app.json`).
- Build diagnostics from `/tmp/observability/build-errors.log`.
- Detailed UI testing remains with the user, as agreed.
