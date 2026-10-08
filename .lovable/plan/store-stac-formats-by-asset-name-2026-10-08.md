# Store STAC formats by asset name

## Goal

Persist each selected STAC asset's detected or manually chosen format in a name-keyed `assetFormats` object, while slightly muting the **Formulated URL** label.

The saved shape will be:

```json
{
  "format": "stac",
  "assets": ["visual", "data"],
  "assetFormats": {
    "visual": "cog",
    "data": "flatgeobuf"
  }
}
```

## Implementation

1. **Update and validate the data contract**
   - Replace the singular optional `assetFormat` field with optional `assetFormats` in both the TypeScript data-source type and Zod schema.
   - Define the map as asset name → one of the existing supported STAC formats: `cog`, `geojson`, `flatgeobuf`, `csv`, or `xyz`.
   - Keep `assetFormats` optional so the existing `config-stac-datasets` fixture and older configurations without stored formats continue to load.
   - Confirm `useValidatedConfig` preserves the map unchanged through its existing data-item spread.

2. **Save formats from the current one-asset editor**
   - Initialise the displayed Asset format from the map entry for the first selected asset.
   - When discovery or manual entry selects an asset, associate the detected or chosen format with that asset name.
   - On save, write the current asset's format under its name in `assetFormats`.
   - Start from the existing map when editing, so entries for additional assets already present in a future multi-asset configuration are preserved.
   - Never carry the previous asset's format onto a newly selected or manually entered asset; use that asset's own existing mapping, detected format, or require a manual selection.
   - Remove singular `assetFormat` completely rather than reading or writing both shapes.

3. **Update shared format resolution**
   - Make `getEffectiveFormat` resolve a STAC source from the format mapped to its first selected asset, falling back to `stac` when the asset or mapping is absent.
   - Keep non-STAC formats unchanged and keep resolved sample URLs session-only.
   - Do not add multi-asset selection to the form in this change; the persisted contract will be ready for it.

4. **Mute the formulated URL label**
   - Apply the existing muted foreground treatment to the **Formulated URL** label, leaving the URL text and layout otherwise unchanged.

5. **Tests and project rules**
   - Update utility and schema tests for mapped lookup, missing/unknown asset mappings, non-STAC passthrough, and `assetFormats` validation persistence.
   - Add focused form/save coverage proving the current selected asset is saved under its name and unrelated mapped entries survive editing.
   - Verify the STAC fixture still validates without `assetFormats`, then run the focused tests and TypeScript check.
   - Update the STAC architecture rule to document that the editor currently exposes one asset while the ordered `assets` array and name-keyed `assetFormats` map preserve future multi-asset support.

## Not included

- Multi-asset selection in the form.
- Converting `assets` from an ordered string array to objects.
- Compatibility support for singular `assetFormat`.
- Gating additional styling tools on effective STAC format; the shared resolver will be ready for that later phase.
