---
title: Categories and colormaps
---

# Categories and colormaps

Two of the four mutually exclusive raster styling tools live behind the **Categories** and **Colormap** sub-sections of the layer card's [Data Visualisation](data-visualisation.md) panel. They serve very different data shapes.

## Categories — discrete classes

Use when raster pixel values represent **discrete classes** (e.g. ESA WorldCover land-cover codes, soil type, administrative region).

Each category row defines:

- **Value** — the pixel value (integer)
- **Label** — human-readable name (e.g. `Tree cover`, `Cropland`)
- **Colour** — fill colour for that class

### Configuring categories

1. Open the layer card → expand **Data Visualisation**
2. Click the **+** next to **Categories**
3. Add rows for each pixel value, or use **Copy from another layer** if a sibling layer already has the right categories
4. Save — the badge in the layer card shows the category count (e.g. `11 classes`)

### Copy from another layer

The category editor includes a **Copy from layer** action that lists all layers with existing categories. Useful when several products share the same legend (e.g. multiple WorldCover years).

### Tips

- Values not listed are rendered transparent
- Order is presentational only — the renderer matches by `value`
- Hex colours are normalised to `#rrggbb` on save

## Colormaps — continuous gradient

Use when pixel values are **continuous numeric** (e.g. NDVI, elevation, temperature). A colormap maps the value range to a gradient.

### Configuring a colormap

1. Open the layer card → expand **Data Visualisation**
2. Click the **+** next to **Colormap**
3. Pick a preset (Viridis, Plasma, Turbo, RdBu, …) or build a custom ramp
4. Set the **min** and **max** of the input range — values outside are clamped
5. Optional: enable **reverse** to flip the gradient
6. Save

### Custom ramps

Custom ramps are an ordered list of `(stop, colour)` pairs. The renderer interpolates linearly between adjacent stops. Use stops at `0` and `1` for a normalised input, or use the layer's value range directly.

### Choosing a preset

| Data shape | Recommended preset |
|---|---|
| Sequential, low-to-high (NDVI, biomass) | Viridis, Plasma, Magma |
| Diverging around a midpoint (anomaly, change) | RdBu, BrBG, PiYG |
| Cyclic (aspect, phase) | Twilight, HSV |
| High-contrast / categorical-like continuous | Turbo |

## When neither fits

- For three-band imagery → use [RGB composite](rgb-composite.md)
- For vector data → use [Vector styling](vector-styling.md)
