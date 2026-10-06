---
title: RGB composite
status: draft
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

## Different settings per dataset

When a layer holds more than one COG (for example a time series), the editor shows a dataset selector with **‹ / ›** arrows.

- The first dataset is edited by default. Every dataset marked **Same as first** follows its settings.
- Pick another dataset to give it **Own settings** — a different stretch, bands, composite or index. Use **Apply** to save and keep stepping through datasets.
- **Reset to same as first** makes a dataset follow the first one again; **Copy to all** copies a dataset's saved settings to every dataset.
- **Compute stretch per dataset** applies the chosen stretch method (e.g. Mean ± 2σ) using each dataset's own pixel values, without loading each histogram by hand. Datasets with own settings are left unchanged.

## Bulk behaviour

Deleting the RGB Composite bulk-removes `convertToRGB` and `bands` from every data source under the layer. Use this when switching to a categorical or colormap rendering.

## Visible range (spectral indices)

In the indices editor the right pane starts with **Index colours** (the labelled stop preview) followed by **Visible range**, a mask that is independent of the colours. Drag the two slider handles (or type Min/Max) to make pixels outside the range transparent — e.g. NDWI stretched over −1 to 1 with a visible range of 0 to 1 hides land and shows only water. Quick preset buttons (Open water, Vegetation only, Urban / built-up, Burn scars, Dense canopy) sit under the slider and set a sensible mask for the chosen index. It is saved as optional `visibleMin` / `visibleMax` in `spectralIndex` (omitted when nothing is hidden) and compiled into the style as extra transparent `case` branches.

Legacy styles and the Custom index render from a generic colour ramp stretched over a value range. For those styles **Customise settings** shows a compact **Colour ramp range** control (Min/Max plus Full range and Positive only presets). Recipe and custom palettes do not use it — their stops carry their own absolute values.

## Index-specific colours

New NDVI, NDWI, MNDWI, NDBI, NBR and NDRE styles use labelled colour stops at meaningful index values. Values outside the first and last stop use the nearest stop colour; they are **not** hidden unless you narrow the Visible range. Expand **Customise settings** at the bottom of the pane and the stop editor opens straight away: edit stop values, colours and legend labels, add or remove stops, or recolour the existing rows with a named ramp. The saved style only becomes customised once you actually edit something — merely expanding the section leaves the recipe default in place. Applying a named ramp preserves the stop values and labels. **Restore [index] defaults** restores the labelled recipe palette.

Saved styles from before these defaults are not silently changed. The exported `spectralIndex.paletteMode` identifies a `"recipe"` or `"custom"` palette, and `spectralIndex.legendStops` contains its ordered `{ value, color, label }` stops, matching the categories shape. Configs saved before the rename used `meaning`; those still load and are re-exported with `label` on the next save. The same stops drive the OpenLayers rendering. The Geospatial Explorer currently receives this data but must add support for displaying these labels in its own legend; the configuration builder does not change the separately hosted viewer bundle.
