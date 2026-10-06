# Fix spectral indices not displaying

## Cause (confirmed in code)
When an index is saved, the editor removes `bands` from the data source and writes a style that refers to the original band numbers (e.g. `["band", 3]`, `["band", 11]`). The Geospatial Explorer only loads the bands listed in `bands`, and numbers them 1, 2, … in that order — so with no `bands` array the index has nothing to read and nothing draws.

## Fix
- Saving an index writes `bands: [bandA, bandB]` (e.g. MNDWI on the CEDA ARD COG → `[2, 9]`).
- The style then refers to those as `["band", 1]` (A) and `["band", 2]` (B), the same remapping RGB uses (`rBand: 1, gBand: 2, bBand: 3`).
- `spectralIndex` keeps the original band numbers so the editor reopens correctly.
- Leave `convertToRGB` off for indices (unchanged).
- Removing an index from the layer card also removes `bands`.

## Technical details
- `src/utils/rgbComposite/indices.ts`: `buildIndexStyle` uses `['band', 1]` / `['band', 2]`; add a short comment on the remapping.
- `RgbCompositeEditorDialog.tsx` (index save branch, ~line 276): keep/set `bands: [cfg.bandA, cfg.bandB]` instead of stripping it.
- `LayerDataVisualisationSection.tsx` (~line 102): also strip `bands` when deleting an index.
- Update `indices.test.ts` to assert relative band references; add a test for the saved item shape.
- Afterwards: user verifies MNDWI on the CEDA layer in Preview.
