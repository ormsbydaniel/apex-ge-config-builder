# Fix missing Tutorial 9 entry and multi-band dialog flicker

## 1. Tutorial 9 not listed
The new file is named `tutorial-9-prerequisites_...json` (plural), but the Tutorials list only recognises `prerequisite` (singular) and silently skips anything else.

- Accept both `prerequisite` and `prerequisites` in file names, treating them as the same kind.
- Add tests for the plural form, including picking the newest dated file when both spellings exist.
- No rename needed in the GitHub repo.

## 2. Flickering multi-band dialog (Bristol Sentinel 2 scene)
Likely cause (to confirm first): the dialog re-runs its "find the COG address" step whenever the layer's dataset list is handed in as a new copy, even if nothing changed. Each run flips the dialog into a "resolving" state and back, which can repeat on every redraw and looks like flicker while band information loads.

Steps:
1. Confirm by loading the Tutorial 9 config and counting how often the resolve step and band-header fetch run while the dialog is open (temporary, targeted logging only, removed afterwards).
2. If confirmed: run the resolve step only when the dialog opens or the COG addresses actually change (compare by content, not by copy), and skip state updates when the resolved addresses are unchanged.
3. If not confirmed, investigate the band-header and histogram loading for this 10-band file instead (e.g. repeated retries on failure) and report back before changing anything else.

## Technical details
- `src/utils/tutorialConfigs.ts`: PATTERN to `(completion|prerequisites?)`, normalise to `prerequisite`.
- `RgbCompositeEditorDialog.tsx`: inspection-URL effect (deps `[open, source.data]`) keyed on a stable signature of COG items' url/assets/assetFormats; avoid setting `inspectionUrls`/`inspectionResolving` when unchanged.
