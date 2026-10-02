# Clarify composite styles and stretch scope in the multi-band editor

## What will change
- Put each histogram’s compact Min, Max and stretch-method controls alongside its band name, above the chart. Reduce the number-input widths; on narrow screens, let the controls wrap cleanly without covering the chart.
- Add subtle dividers and vertical breathing room between Dataset, Composite and Channels in the left pane (and between Spectral indices and its settings where relevant). Do not add an empty Dataset section for single-COG layers.
- Show **Apply to all datasets** whenever a multi-COG composite is open, regardless of the selected dataset. It governs **contrast stretch only**, not the composite recipe. When enabled, a stretch choice computes each dataset’s ranges from its own pixels and its own selected bands, including datasets with their own visualisation; preserve their recipes/band assignments. Show progress for uncached histograms; reuse cached results on later changes. Turning it off returns stretch edits to the selected dataset only.
- When choosing a different composite recipe, ask whether to change **This dataset** or **All datasets**, with Cancel. Choosing all changes the composite recipe/bands for every COG while leaving the stretch checkbox independent; each dataset can still have its own stretch. Picking custom bands follows the same style scope when saved. Make the choice explicit before changing other datasets; retain the existing Save/Apply flow rather than silently persisting an unconfirmed change.
- Label dataset choices with their current visualisation, for example **1. [date] · Natural colour** and **2. [date] · Agriculture** (or the index name/Custom when appropriate), instead of using the dropdown to communicate stretch scope. Keep the existing status badge and reset/copy actions distinct.

## Verification
- Add focused tests for scope choices and their interaction: changing one recipe does not alter peers; changing all recipes does not force a shared stretch; all-dataset stretch uses each COG’s own bands and retains its visualisation; cancel makes no change. Check the compact histogram controls.
- Check Bristol (one COG) and East London (multiple COGs) from **Multispectral datasets** in the preview at standard and narrow widths. Confirm dataset names, confirmation choices, visible checkbox on dataset 2, dividers, wrapping and progress/cached switching. Run focused tests and review preview diagnostics; detailed UI testing remains with you.

## Technical approach
- Update the existing editor and histogram component without changing the JSON schema or unrelated visualisation tools. Separate the recipe/band scope decision from stretch scope in the editor state. For all-dataset stretch, read each target item’s bands rather than copying the currently selected bands; preserve `styleSource: 'own'` where needed. Keep the existing histogram cache and per-item style generation, and add focused helper tests for the transformations.
