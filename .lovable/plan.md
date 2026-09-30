# Reverse palette in vector styling recipes

## What you'll see
- A **Reverse** checkbox next to the Palette dropdown in the recipe setup, shown for **Graduated** and **Categorised** (the only recipes that use a palette). Same pattern as the raster colormap "Reverse" checkbox.
- The swatches in the dropdown, the category swatch preview and the class-break preview flip immediately, so you see the reversed order before pressing Create rule.
- Graduated: the lowest class gets the palette's last colour, the highest gets the first (e.g. Viridis yellow → purple).
- Categorised: colours are assigned to values in reverse palette order.
- Existing rules are unaffected; reversing only changes the colours written into the new rule (no new config field — standard OpenLayers colours as today).

## Technical details
- `src/utils/vectorStyle/palettes.ts`: add optional `reverse` argument to `sampleRamp` and `assignCategoricalColors` (reverse the source palette colours before sampling/assigning).
- `src/utils/vectorStyle/recipes.ts`: add optional `reversePalette?: boolean` to the categorised and graduated recipe inputs and pass through `resolveCategoryColors` / `buildGraduatedRecipe`.
- `src/components/vectorStyle/RecipeWizard.tsx`: `reversePalette` state (reset when palette list changes by recipe), Checkbox + "Reverse" label beside the Palette select, reversed swatches in dropdown items and previews, passed into `buildRecipeRules`.
- Tests: reversed ramp/categorical output in `recipes.test.ts` (first/last colour swapped, default unchanged).
- Docs: one sentence in `docs/layers/vector-styling.md` recipes section; strict MkDocs build.
- No schema changes. Visual testing left to you.
