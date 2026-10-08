# Future-safe STAC asset format mapping

## Goal

Introduce a format mapping keyed by STAC asset name now, while retaining the current one-asset editor and compatibility with the existing singular `assetFormat` property.

Example saved shape:

```json
{
  "format": "stac",
  "assets": ["visual", "data"],
  "assetFormats": {
    "visual": "cog",
    "data": "flatgeobuf"
  },
  "assetFormat": "cog"
}
```

`assets` remains the Explorer-compatible ordered array. `assetFormats` provides stable per-asset metadata without relying on matching array positions. During the compatibility period, `assetFormat` represents the first selected asset.

## Implementation

1. **Synchronise the saved structure**
   - Add optional `assetFormats` to the data-source schema and TypeScript type using the same supported-format values as `assetFormat`.
   - Confirm both singular and mapped values survive validation and config round trips.
   - Keep `assetFormat` optional so existing configurations, including the new fixture, continue to load unchanged.

2. **Centralise compatibility rules**
   - Add utility helpers that resolve a named asset’s format from `assetFormats` first, then use singular `assetFormat` only for the first selected asset.
   - Make effective-format gating use the first selected asset through this helper.
   - Keep sample asset URLs session-only; neither format property will store resolved or signed URLs.

3. **Update the current one-asset editor**
   - When discovery, automatic detection, or manual override resolves the selected asset, save that value under its asset name in `assetFormats`.
   - Also save the same value to `assetFormat` for current Explorer compatibility.
   - Changing the selected asset must not associate the previous asset’s format with the new name.
   - Preserve any existing mapped entries when editing a future multi-asset configuration, even though the current UI exposes one selected asset.

4. **Use the new STAC fixture for coverage**
   - Treat manifest test config `stac-datasets` as the primary STAC development fixture.
   - Cover collection URLs, query-parameter item lists, direct item URLs, explicit asset names, swipe datasets, vector assets, and multi-band raster assets.
   - Verify the fixture still loads before it contains either format property, then verify detection/edit/save adds the compatible singular and mapped values.

5. **Tests and documentation of the contract**
   - Add focused tests for mapped lookup, singular fallback, unknown asset names, stale mappings, validation persistence, and one-asset save behavior.
   - Record that `assets` remains an ordered string array for Explorer compatibility and `assetFormats` is keyed by asset name for future multi-asset support.
   - Update the existing STAC project rule from “one renderable asset” to “one asset exposed by the current editor, multiple assets preserved by the data contract.”

## Boundaries

- Do not add multi-asset selection to the UI yet.
- Do not convert `assets` into an object array.
- Do not require `assetFormat` or `assetFormats` when loading legacy configurations.
- Do not persist resolved sample asset URLs.
- The general modal-editor assessment remains parked.
