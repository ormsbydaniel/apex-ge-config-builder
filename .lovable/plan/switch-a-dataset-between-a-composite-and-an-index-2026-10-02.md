# Switch a dataset between a composite and an index

## What already works
- Selecting a dataset in the dropdown already loads that dataset's own visualisation: an index dataset opens the indices editor, a composite dataset opens the composite editor.
- Dropdown labels already include index names (e.g. "3. 2026-06-26 · Normalised Difference Water Index"), because labels come from each dataset's saved settings.

## What is missing
- Changing from a composite to an index (or back) does not ask "This dataset / All datasets" and only takes effect on Save, so the dropdown and map do not update straight away.
- Index recipe buttons never ask the scope question; index saving follows the older "first dataset + same as first" rule.

## Changes
1. **Ask the same question for every style change.** Picking an index while viewing a composite (via "Back to visualisations" > Indices tab, or the gallery), picking a composite while viewing an index, or switching between indices, opens the existing "Change style?" dialog with Cancel / This dataset / All datasets. With single-dataset layers no question is asked, as now.
2. **Apply straight away.** On confirmation the change is written immediately (as composites do today), so the dropdown label and the map update without pressing Save:
   - This dataset: only the selected dataset changes; it becomes "own settings".
   - All datasets: every dataset gets the new visualisation and becomes "same as first" again. Composites: each dataset is restretched from its own pixels. Indices: the same bands, colour ramp and range apply to all.
3. **Short dropdown labels for indices.** Use the short index name so it reads "2026-06-26 · Water (NDWI)" instead of the long full name. Composites keep "Natural colour", "Agriculture", etc.
4. **Editor follows the dataset.** Moving Previous/Next or using the dropdown switches the editor between the composite view and the indices view to match that dataset (already the case; kept and checked on a mixed layer).
5. **Index detail edits** (colour ramp, range, bands) apply to the selected dataset; on the first dataset they also update the datasets marked "same as first", matching current behaviour.

## Not changing
Saved file format (index and composite settings already live on each dataset), the stretch "Apply to all datasets" checkbox (composites only), histogram caching, layer-card summary.

## Technical details
- `styleScope.ts`: add `applyIndexStyle(data, scope, cfg, all)` mirroring `applyCompositeStyle` — writes `bands [A,B]`, `style: buildIndexStyle(cfg)`, `spectralIndex`, removes `convertToRGB`/`batchStretch`; markers: all → cleared, this (non-first) → `'own'`, first-only → former followers marked `'own'`. Make `applyCompositeStyle` also strip `spectralIndex` (already does on rewrite) for index→composite.
- `RgbCompositeEditorDialog.tsx`: route `applyIndexRecipe` from recipe buttons and `handleGalleryPickIndex` / `handleGalleryPick` through `askStyleScope` when `multiDataset`; extend the commit effect to handle `mode === 'index'` via `applyIndexStyle`; for kind switches to composite, commit after histograms provide a stretch (existing restretch path).
- `visualisationName`: return the recipe's short label + acronym for indices.
- Tests in `styleScope.test.ts`: composite→index for one dataset, all datasets, and back; mixed layer labels. Playwright on East London: switch dataset 2 to NDRE ("This dataset"), confirm dropdown label and that stepping between datasets 1 and 2 toggles the editor view.
