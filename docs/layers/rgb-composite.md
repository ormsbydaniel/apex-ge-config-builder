---
title: RGB composite
---

# RGB composite

Render a multi-band raster source — typically a Cloud Optimized GeoTIFF — as a true-colour or false-colour composite by mapping three bands to the Red, Green, and Blue channels.

## When to use

- Sentinel-2 / Landsat / Planet / aerial imagery where you want a natural-looking picture (e.g. bands 4-3-2 for Sentinel-2 true colour)
- False-colour analysis (e.g. NIR-Red-Green for vegetation)
- Hyperspectral cubes where you want to inspect a specific three-band slice

For single-band products use a [Colormap](colormaps.md) instead.

## How the configuration is stored

RGB composites are driven **per data source**, not at the layer level. Each item in a layer's `data` array gets:

- `convertToRGB: true`
- `bands: [r, g, b]` — exactly three band indices (1-based), in R/G/B order

This means a single layer can hold multiple COGs (e.g. one per scene) and the same band selection applies uniformly. The legacy layer-level `rgbComposites` property has been removed from the schema — do not add it manually.

## Configuring an RGB composite

1. Open the layer card and expand **Data Visualisation**
2. Click the **+** next to **RGB Composite**
3. The editor lists every band detected in the source (from COG metadata)
4. Select **exactly three** bands — they will be assigned R, G, B in selection order
5. Reorder by clicking the R / G / B chips on each selected band
6. Save — the badge in the layer card now shows coloured `R: n`, `G: n`, `B: n` chips

## Advanced settings (per-channel min/max)

Once exactly three bands are selected, an **Advanced Settings ›››** button appears beneath the **Selected Bands** list. Opening it:

- Hides the band-selection columns to give the channel editor more room
- Shows a histogram and **min** / **max** input for each of R, G, B
- Persists the values as an OpenLayers-compatible `style` block on each data source item

The viewer only loads the three bands you requested, so the persisted style always references them as `rBand: 1`, `gBand: 2`, `bBand: 3` regardless of the original band numbers — this remapping is automatic.

!!! tip "When to tune min/max"
    Imagery often has an overall brightness range that doesn't match its true value range (e.g. 16-bit data with most values in a narrow window). Setting tighter min/max values per channel dramatically improves contrast without altering the underlying data.

## Bulk behaviour

Deleting the RGB Composite bulk-removes `convertToRGB` and `bands` from every data source under the layer. Use this when switching to a categorical or colormap rendering.
