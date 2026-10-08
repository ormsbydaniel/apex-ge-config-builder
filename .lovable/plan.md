# Future-safe STAC asset format mapping

## Goal

Replace the not-yet-adopted singular `assetFormat` property with a format mapping keyed by STAC asset name, while retaining the current one-asset editor.

Example saved shape:

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

`assets` remains the Explorer-compatible ordered array. `assetFormats` provides stable per-asset metadata without relying on matching array positions. The current editor uses the format mapped to `assets[0]`; future multi-asset support can use every named entry.

## Implementation

1. **Synchronise the saved structure**
   - Remove singular `assetFormat` from the data-source schema, TypeScript type, editor state, utilities, and tests.
   - Add optional `assetFormats` to the schema and type as a record keyed by asset name, using the existing supported-format values.
   - Confirm the map survives validation and config round trips.
   - Keep `assetFormats` optional so existing configurations, including the new fixture, continue to load unchanged and can be detected when edited.

2. **Centralise format resolution**
   - Add utility helpers that resolve a named asset’s format from `assetFormats`.
   - Make effective-format gating use the format mapped to the first selected asset, falling back to `stac` when that entry is absent.
   - Keep sample asset URLs session-only; neither format property will store resolved or signed URLs.

3. **Update the current one-asset editor**
   - When discovery, automatic detection, or manual override resolves the selected asset, save that value under its asset name in `assetFormats`.
   - Changing the selected asset must not associate the previous asset’s format with the new name.
   - Preserve any existing mapped entries when editing a future multi-asset configuration, even though the current UI exposes one selected asset.

4. **Use the new STAC fixture for coverage**
   - Treat manifest test config `stac-datasets` as the primary STAC development fixture.
   - Cover collection URLs, query-parameter item lists, direct item URLs, explicit asset names, swipe datasets, vector assets, and multi-band raster assets.
   - Verify the fixture still loads without `assetFormats`, then verify detection/edit/save adds the correct name-keyed entry.

5. **Tests and documentation of the contract**
   - Add focused tests for mapped lookup, missing mappings, unknown asset names, stale mappings, validation persistence, and one-asset save behavior.
   - Record that `assets` remains an ordered string array for Explorer compatibility and `assetFormats` is keyed by asset name for future multi-asset support.
   - Update the existing STAC project rule from “one renderable asset” to “one asset exposed by the current editor, multiple assets preserved by the data contract.”

## Boundaries

- Do not add multi-asset selection to the UI yet.
- Do not convert `assets` into an object array.
- Do not retain, export, or support singular `assetFormat`.
- Do not require `assetFormats` when loading configurations.
- Do not persist resolved sample asset URLs.
- The general modal-editor assessment remains parked.
