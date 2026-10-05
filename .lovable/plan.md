# Index-specific colour palettes and legend-ready stops

## Direction
Use the uploaded JSON as the source for six index defaults: NDVI, NDWI, MNDWI, NDBI, NBR and NDRE. Each supplied stop has an absolute index value, colour and meaning. Keep existing palette/range controls available under **Advanced**, rather than making the defaults immutable. Prepare labelled stop data for the Geospatial Explorer; displaying it in the Explorer requires a separate viewer-bundle change.

## Options considered
1. **Defaults with Advanced overrides (chosen):** intuitive index-specific colours and meanings, while retaining flexibility and preserving existing styles.
2. **Fixed palettes:** simpler interface, but unsuitable when a dataset needs a different range or colour treatment.
3. **Multiple selectable variants:** flexible, but adds choices without a clear need yet.

## Behaviour
- New applications of the six named recipes use the JSON's exact stop values and colours, not a uniform rescaling of a generic gradient. Values beyond the outer stops use the endpoint colours; the existing independent visible-range mask still controls transparency.
- The main index styling area shows the selected recipe's default ramp and meaningful value markers. **Advanced** contains the existing palette, reverse and min/max controls plus a way to restore the recipe default. A manual override uses the existing generic-ramp behaviour; do not present the default stop meanings as if they still described an overridden ramp.
- Custom indices keep their current generic controls. Previously saved index styles and metadata reopen and render unchanged; switching an existing style to the new default is an explicit user action, not an import-time migration.
- Export a per-COG, legend-ready ordered list of actual stop values, colours and meanings for default recipe styles. Keep it in sync when applying a recipe to one dataset or all datasets. For overridden or older styles, avoid exporting incorrect default labels; leave the existing layer legend configuration untouched.

## Technical approach
- Define and validate the six labelled absolute-stop palettes alongside index recipes, and compile those stops into the existing OpenLayers index style expression. Keep the legacy generic-ramp path for old configurations and advanced overrides.
- Add an optional, explicit per-item representation for the chosen default/legend stops, synchronized across the Zod schema, TypeScript types and validation/export flow. Derive colour and legend data from the same palette definition when saving, so per-dataset visualisations cannot disagree.
- Update the index editor only; preserve composite controls, scope confirmation and visible-range behaviour. Update index documentation to distinguish colour mapping from masking and to describe Explorer legend readiness.

## Verification and boundary
- Test all six palette values/order/colours and generated styles, endpoint clamping, the separate mask, legacy round trips, and one-vs-all dataset scope including mixed composite/index layers. Run focused tests and typecheck; leave detailed visual testing to the user.
- The builder can export labelled stops, but the separately hosted Geospatial Explorer bundle must be updated to read and display them. Do not claim its legend appears until that viewer work is done.
