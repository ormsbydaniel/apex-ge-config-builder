# Computed Composites: openEO barren-soil recipe

## Outcome
- Add a third **Computed Composites** tab within Multi-band visualisations, with a **Barren soil** recipe.
- Use the supplied openEO graph's fixed defaults. Do not add per-channel histograms, histogram fetching, or statistical stretch controls for this mode.
- Keep band selection on the left and a compact channel/default summary on the right.
- Retain existing per-dataset navigation and the **This dataset / All datasets** choice when switching recipes or bands, including switching between standard composites, indices and computed composites.

## Corrected source definition
The original graph differs from the earlier proposed BSI/NDVI/NDWI composite. It loads only Blue, Red, NIR and SWIR1, and outputs:

- **Red:** `2.5 × ((SWIR1 + Red) − (NIR + Blue)) / ((SWIR1 + Red) + (NIR + Blue))`.
- **Green:** `NIR / 10000`.
- **Blue:** `SWIR1 / 10000`.

The common reflectance scale cancels in the red-channel ratio. There is no green-band input, NDVI, NDWI, or universal 0–0.4 stretch in this graph. Use gain **2.5** and reflectance divisor **10000**, with final display channels clamped to 0–1. The graph hardcodes gain 2.5 even though its parameter list also describes brightness.

This recreates the graph's per-pixel RGB calculation for an existing COG, not its cloud-filtered scene acquisition or first-observation temporal reduction. For already-scaled reflectance, expose only a clear input-scale choice so the divisor is not applied twice.

## Technical implementation
1. Add optional per-COG `computedComposite` metadata to the Zod schema first, corresponding TypeScript types second, then verify validation and export persistence before implementing its controls. Keep existing saved styles unchanged.
2. Add a focused recipe/compiler utility using the existing sensor-band resolver. Resolve Blue, Red, NIR and SWIR1 from the actual supported profiles and metadata; require explicit selections when they cannot be identified reliably.
3. Compile the recipe into OpenLayers GPU expressions using the selected-band order, not original COG band numbers. Keep source normalization consistent with the reflectance divisor. Mask declared NoData and zero-denominator pixels safely.
4. Extend the gallery and editor mode handling without reorganising working hooks. Extend per-dataset scope/display-name utilities and all existing multi-band save/removal/detection paths to recognise the new kind. Save once through the existing dispatch, removing mutually exclusive recipe metadata when switching kind.
5. Update architectural rules to cover three focused recipe workflows sharing one dialog and saving path.

## Verification
- Compare compiled channels against direct evaluation of the supplied graph using numeric fixtures, including zero denominators and NoData.
- Test supported sensor mappings, selected-band remapping, raw versus already-scaled reflectance, schema validation and export/save/reopen persistence.
- Test single-COG recipe/band saves and mixed per-dataset mode changes with both scope choices.
- Use Bristol and East London in the multispectral test config to check the third tab and matching editor when navigating datasets. Confirm this mode does not request histograms.

## Not included
- New histogram previews or statistical stretch computation for computed composites.
- Arbitrary formula editing, additional computed recipes, openEO execution, or unrelated visualisation/JSON-editor changes.