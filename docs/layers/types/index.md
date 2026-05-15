---
title: Layers
status: draft
---
# Layers

A **layer** is a renderable thing the user sees on the map. The definition
of a layer comprises:

- **Where it lives in the UI** — an *interface group* (and optional
  *sub-interface group*), or the basemap picker for base layers.
- **What it shows** — one or more *data sources* (service+layer references
  or direct URLs to COG, GeoJSON, FlatGeoBuf, CSV, WMS/WMTS layers, etc.).
- **How it is visualised** — colormap, RGB composite, vector styling rules,
  or categorical classes.
- **Supporting content** — description, attribution, legend, units.
- **Functional controls** — opacity, temporal controls, zoom to layer,
  download link, layer toggles.
- **Advanced features** — statistics, constraints, charts.

The Configuration Builder supports three layer types. Each behaves
differently in the deployed APEx Geospatial Explorer.

## The three layer types

### Standard layer

The default and the most common type. A user-facing layer card with a
title, description, an interface group, and a styling choice. It can carry
It can carry a single or multiple data sources for a raster dataset
rendered as a colormap, an RGB composite, a time-series, plus statistics,
constraints and charts.

Use a standard layer for almost everything you want a user to be able to
toggle on the map.

→ [Standard layers](../standard-layers.md)

### Swipe layer

Compares two raster sources side-by-side under a draggable handle on the
map. The user drags the handle to reveal more or less of the **clipped**
source over the **base** source.

Use a swipe layer for before/after imagery, A/B comparisons of model
outputs, or comparing band combinations or processing levels.

→ [Swipe layers](../swipe-layers.md)

### Base layer

A background basemap. Selected from the basemap picker, no UI controls, no
statistics, no constraints. Only one base layer is visible at a time.

Use a base layer for OSM, satellite imagery, terrain hillshades, or any
custom organisation basemap.

→ [Base layers](../base-layers.md)

## How to choose

| If you want… | Use |
|---|---|
| A toggleable data overlay with styling, statistics, or constraints | **Standard** |
| Two rasters compared under a draggable handle | **Swipe** |
| The map background under everything else | **Base** |

## Where layers live in the tab

```text
Interface Group
└── Sub-Interface Group (optional)
    └── Layer Card (Standard or Swipe)
        └── Data Source(s)

Base Layers (separate section at the top of the Layers tab)
└── Base Layer
    └── Data Source
```

See [Layers tab overview](../index.md) for the full structure of the tab.
