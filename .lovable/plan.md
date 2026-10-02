# Contextual range presets per spectral index

## Goal
Replace the one-size-fits-all range preset buttons (Full range / Positive only / Vegetation) in the index editor with presets tailored to each index recipe, so non-vegetation indices no longer show a meaningless "Vegetation" shortcut.

## Design
- Each index recipe carries its own set of 2–3 preset buttons, shown under the index value range controls:
  - **NDVI**: Full range (−1 to 1), Positive only (0 to 1), Vegetation (0.1 to 0.7)
  - **NDWI**: Full range, Positive only, Open water (0.1 to 0.6)
  - **MNDWI**: Full range, Positive only, Open water (0.1 to 0.6)
  - **NDBI**: Full range, Positive only, Urban / built-up (0.0 to 0.4)
  - **NBR**: Full range, Positive only, Burn severity (−0.1 to 0.6)
  - **NDRE**: Full range, Positive only, Dense canopy (0.2 to 0.6)
  - **Custom index**: Full range, Positive only
- Clicking a preset sets the min/max fields exactly as today; manual edits still work and the recipe's own default range remains the initial value.

## Technical approach
- In `src/utils/rgbComposite/indices.ts`, move presets onto the `IndexRecipe` definition (e.g. an optional `presets` array per recipe), falling back to Full range + Positive only when none are defined. Keep the existing `INDEX_RANGE_PRESETS` export shape or replace it with a per-recipe lookup helper.
- In the index editor section of `RgbCompositeEditorDialog.tsx`, read the presets from the currently selected recipe instead of the global list, so switching recipes swaps the buttons.
- Update `src/utils/rgbComposite/__tests__/indices.test.ts` to cover the per-recipe presets (each recipe exposes its presets; custom falls back to the two generic ones).
- No schema, saved-config, or viewer changes — presets only set the same min/max fields as before.

## Verification
- Run the indices unit tests, typecheck, and check the build signal.
- Visual check of the buttons per recipe left to the user's desktop UI testing.
