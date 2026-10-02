# Fix the index "Visible range" not working in the viewer

## What the screenshot suggests
The image isn't a masked NDWI at all. Land is pink and green, water is blue, and there are no transparent areas, so it looks like plain imagery with no index colours. If the mask were being applied to the raw band values, we would expect patches of NDWI colours with gaps. A full fallback to plain imagery points to the viewer **rejecting the whole index style** once the extra "hide" rules are added, then drawing the image with its default look. The cause isn't confirmed yet, so step 1 is to prove it.

## Steps
1. **Reproduce outside the app.** Take the style this app now saves for NDWI with visible range 0 to 1. Render it on one East London image in a plain OpenLayers test page, using the same OpenLayers version as the viewer bundle. Do the same with no mask. Record whether the masked version renders, errors, or falls back.
2. **Check the saved settings.** Confirm which datasets got the mask: only the one being viewed, or all datasets with "Same as first". Also confirm the bands and style saved for the dataset shown in the screenshot.
3. **Fix based on what step 1 shows:**
   - If OpenLayers or the viewer can't handle the extra `case` branches, or how they're written: build the mask so it's always valid. For example, put the visibility check in one combined condition (`['any', ['<', index, vmin], ['>', index, vmax]]`), or put the result in a style variable/`filter`, whichever renders correctly in step 1.
   - If the mask is being compared against a raw band value instead of the index: fix the expression so it compares against the calculated index.
   - If only the viewed dataset got the mask: make sure saving and "All datasets" write it where you'd expect.
4. **Check it renders correctly:** in plain OpenLayers, NDWI with a 0 to 1 visible range shows only water, with land transparent. With no mask, the result matches what you see today.
5. Update the tests so they check the corrected style shape, then run the focused tests, the type check and the build.

## Not changing
The slider, saved field names, composites, or layers without a mask.

## Technical details
- The style comes from `buildIndexStyle` in `src/utils/rgbComposite/indices.ts`. It currently adds `['<', index, vmin] -> transparent` and `['>', index, vmax] -> transparent` branches inside `case`.
- The repro page loads OpenLayers from npm at the version shipped in the S3 bundle, and renders WebGLTile with GeoTIFF source `bands: [3, 8]` (or the saved bands), checking the console for shader compile errors.
