# Default "nice" range in the Graduated recipe

## What changes for you
When you pick a numeric field in the Graduated recipe, the Range boxes fill with rounded values instead of the raw sample extremes. For example, a sample of `2.18025523` to `61417.3589` becomes `0` to `70000`.

- The rounded range always covers the sampled data: min rounds down, max rounds up.
- Under the Range inputs, a small grey line shows the real sample range ("Sample: 2.18 – 61,417.36"), with a **Use exact** link that puts the raw values back.
- If you type your own min or max, your values are kept. Switching to a different field fills in a new rounded range.
- The class breaks use the rounded range, so the legend shows tidy numbers (for example 0, 14000, 28000...).

## How the rounding works
This is the "nice numbers" method used in charting tools such as D3, Excel axis auto-scaling and QGIS "pretty breaks":

1. Take the span (max − min) and find a round step based on the class count, using 1, 2, 2.5 or 5 × a power of ten.
2. Round min down and max up to that step.
3. If min is ≥ 0 and close to zero (less than about 20% of the span), start from 0.
4. Edge cases:
    - If min equals max, add one step each side.
    - Negative ranges work the same way.
    - Very small ranges, such as 0.0012–0.0087, get small decimal steps.
    - The result never loses precision below the step size.

## Technical details
- `src/utils/vectorStyle/recipes.ts`: add a pure `niceRange(min, max, classes)` function that returns `{ min, max, step }`. It sits next to the other recipe utilities, following the preset-in-utilities rule.
- `src/components/vectorStyle/RecipeWizard.tsx`: the field-seeding `useEffect` sets min/max from `niceRange(...)` and keeps the raw bounds for the "Sample:" hint and the **Use exact** link. Changing the class count does not overwrite values you have already set.
- Quantile classification still uses the sampled values. Only the outer bounds use the nice range.
- `recipes.test.ts`: add cases for the example above (→ 0–70000), zero-snapping, negative ranges, tiny decimals, min equal to max, and always covering the raw range.
- `docs/layers/vector-styling.md`: add one sentence about rounded ranges, then run a strict MkDocs build.
- No config schema changes.
- Checks: unit tests and a clean build. You do the visual testing.
