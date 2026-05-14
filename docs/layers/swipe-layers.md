---
title: Swipe layers
---

# Swipe layers

A swipe layer compares two (or more) raster sources side-by-side under a draggable handle on the map. The user drags the handle left/right to reveal more or less of the **clipped** source over the **base** source(s).

## When to use

- Before / after comparisons (e.g. pre- and post-event imagery).
- Comparing two model outputs over the same area.
- A/B comparison of band combinations or processing levels.

For two layers that should both be fully visible and toggleable independently, use two normal layer cards instead.

## Configure

In the **Layers tab**, add a layer and set its type to **Swipe**. The swipe configuration lives in `meta.swipeConfig`:

- **Clipped source** (`clippedSourceName`) — the source revealed under the swipe handle. Choose from the layer's data sources.
- **Base source(s)** (`baseSourceNames`) — one or more sources rendered underneath. When more than one is provided, the viewer shows a small picker so the user can switch which base is compared against.

Each source still uses the same data source format as a normal layer (COG, XYZ, WMS, etc.), and `position` on each `DataSourceItem` (`'left'`, `'right'`, `'background'`, `'spotlight'`) controls how it participates in the comparison.

## Validation

- Exactly one `clippedSourceName` is required and must match a source in `data`.
- `baseSourceNames` must contain at least one entry, each matching a source in `data`.
- The clipped source and base sources should share a CRS and roughly cover the same extent for the comparison to be meaningful.

## Related

- [Adding layers](adding-layers.md)
- [Data visualisation](data-visualisation.md) — styling applies independently to each side.
