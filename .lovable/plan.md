

## Remove redundant toggle from RGB Composite Editor

The "Enable RGB Composite rendering" checkbox is unnecessary — the act of saving the dialog with selected bands should implicitly enable `convertToRGB`, and the existing Delete button in the Data Visualisation section already handles disabling it.

### Changes to `RgbCompositeEditorDialog.tsx`

1. **Remove `enableRgb` state** and the checkbox UI (lines 130, 261-267)
2. **Always show the band selector** — remove the `{enableRgb && (...)}` conditional wrapper (lines 270, 350)
3. **Simplify `handleSave`** — always set `convertToRGB: true` and `bands: [...selectedBands]` on all COG sources. No else branch needed.
4. **Simplify save button disabled state** — just `disabled={selectedBands.length !== MAX_BANDS}`
5. **Update dialog description** — remove mention of "Enable" toggle; just say "Assign bands to the Red, Green, and Blue channels."
6. **Update initialization** — no need to read `enableRgb` from sources; just read current bands from first RGB source (or default `[1,2,3]`)

