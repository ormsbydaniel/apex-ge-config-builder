# Scoping: format-dependent features for STAC data sources

This is a scoping document for discussion. It does not change any code yet.

## The problem
A STAC data source (`format: "stac"`) stores only a collection or items URL, plus optional `assets` names. The builder decides many things from the format:
- **Raster (COG):** metadata and band checks, colour ramps, categories, multi-band visualisations, histograms, pixel-value and time-series charts, constraints.
- **Vector (GeoJSON / FlatGeobuf):** vector styling, fields editor, field-value charts.
- **CSV:** chart data.
- **Tiles (XYZ links):** almost none of the above.

With `"stac"`, none of these features know which branch applies.

## Issues
1. **Unknown format.** The asset format can only be found by reading the STAC items.
2. **Mixed assets.** One data source can name several assets, and each can have a different format (for example a COG plus a thumbnail, or COG plus GeoJSON).
3. **Format can vary between items.** It is rare, but nothing guarantees that every item's asset with that name has the same type.
4. **Cost and reliability.** Each time a dialog opens, fetching items, and then asset headers or bytes, costs time. It also fails offline or with signed or rate-limited URLs. Large FGBs have already caused browser pressure.
5. **Which file to inspect.** COG metadata, histograms and field detection need one actual file URL. Today these features use `data[i].url` directly.
6. **Per-dataset styling.** Per-COG settings (`styleSource`, histograms) assume one data item per file. A STAC source is one item that stands for many files at runtime.
7. **Viewer contract.** The Explorer has to resolve items and assets the same way the builder does, or the styles will not match.
8. **Validation and export.** Any new field has to be added to the Zod schema, the TypeScript type, useValidatedConfig and the ConfigJson export mapping.

## Options

### A. Inspect on demand, store nothing
Fetch the first item (`limit=1`), find the named asset, and work out its format from the media type or extension.
- Pros: nothing extra in the config, and the result is always current.
- Cons: a network call every time; fails offline; the UI can't decide what to show until the fetch returns; the viewer can't benefit.

### B. Store an `assetFormat` that the user enters
- Pros: simple and predictable, with no fetch needed.
- Cons: can be wrong or stale, and makes the user do the work.

### C. Hybrid (recommended)
Detect the format when the source is added or its assets are edited. Save the result, and let the user override it.
- Detect: fetch one sample item, take the named asset's `type`, and fall back to the extension using the existing `detectAssetFormat`. Optionally confirm with a HEAD request.
- Save a small, optional block on the data item, for example:
  ```text
  assetInfo?: {
    format: 'cog' | 'geojson' | 'flatgeobuf' | 'csv' | 'xyz' | ...,
    sampleUrl?: string,        // resolved href from sample item, used for metadata/histograms/fields
    bandLabels?: string[],     // from eo:bands, reuses existing bandLabels path
    detectedAt?: string,
    source: 'detected' | 'manual'
  }
  ```
  For several assets, use a map keyed by asset name, or require one renderable asset per data source.
- Feature gating uses an "effective format" helper: `format === 'stac' ? assetInfo.format : format`. This one change applies to every format-dependent check.
- Format-dependent tools use `sampleUrl` wherever they currently use `url`.
- Offer a "Re-detect" action, and warn if the saved format no longer matches what the sample shows.
- Pros: works offline after setup, gives the UI a quick answer, and puts the logic in one place. The viewer could also use it as a hint.
- Cons: one more schema field, and the sample can go stale (the warning handles this).

### D. Expand STAC into concrete data items
When the source is added, resolve its items into ordinary COG or vector data items. This is close to how "Add All Filtered Items" works already.
- Pros: every existing feature works unchanged.
- Cons: loses the point of a live STAC query, because new items won't appear.

## Open questions
1. Should one STAC data source allow only one renderable asset (simpler gating), or several assets with mixed formats?
2. Per-dataset styling: should STAC sources share a single style only (recommended for a first version), or have per-item overrides? Overrides would mean the viewer matches items by id.
3. Should batch stretch or histogram statistics sample N items, for example the first 3 to 5, rather than just one?
4. Does the Explorer need `assetInfo.format`, or will it detect the format itself? This decides whether the field is builder-only metadata.
5. Should XYZ-link collections count as a separate case (raster tiles, with no COG tools)?

## Suggested phasing
1. Add an effective-format helper and the `assetInfo` schema and type, through the whole schema, type, validation and export chain. Gate features on it, and grey out unsupported tools for STAC sources that have no detected format.
2. Detect the format on add or edit (one sample item), and show a small format badge with a re-detect action.
3. Point COG metadata, colour ramps, multi-band tools and the vector fields and styling tools at `sampleUrl`.
4. Later: multi-item sampling for statistics, and per-item overrides if they are needed.
