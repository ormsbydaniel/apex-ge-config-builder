# RGB editor: contrast stretch tweaks

## What changes
1. **Remove "Stretch all"** — choosing a method in the dropdown already re-stretches all three bands, so the button is redundant. Re-picking the same method while showing "Custom" re-applies it.
2. **Rename the label** to "Contrast stretch (all bands)".
3. **Per-band stretch buttons match the dropdown** — each histogram's buttons become exactly the dropdown options: **2–98% cut**, **Full range**, **Mean ± 2σ** (replacing today's 2–98% / 1–99% / Full). Clicking one stretches only that band and flips the dropdown to **Custom**.

Example: pick 2–98% cut from the dropdown (all bands), then click Mean ± 2σ on Green → Green re-stretches, dropdown shows Custom.

## Technical details
- `RgbCompositeEditorDialog.tsx`: delete `stretchAll`, `stretching`, `stretchSummary` and the Wand2 button; update label and the "Custom" hint text. Make the dropdown's selectable value work when re-selecting the active method from Custom (Select value is 'custom', so any method pick fires onValueChange).
- Pass a new `stretchOptions` prop to `BandHistogram` built from `STRETCH_METHODS` (short labels), with `onApplyMethod(method)` that runs `computeStretch(method, hist)` for that channel via `editRange` (which already sets Custom).
- `BandHistogram.tsx`: render buttons from `stretchOptions` when provided; keep current buttons as fallback for other callers.
- Add short button labels to `STRETCH_METHODS` in `recipes.ts` (`shortName`) so the list stays defined in one place.
