---
title: Layers overview
---
# Layers overview

The **Layers** tab is where you build the visible content of your
APEx Geospatial Explorer — every map layer, its data source(s), how it is
styled, and where it appears in the UI.

!!! tip "Follow along"
    Screenshots on this page were taken with the **Comprehensive demo**
    config loaded.

![Layers tab showing the Map Layers header (42 layers total) and six interface groups: Soils, Biodiversity & Ecosystem Accounting, Land Cover, Vegetation, etc.](../assets/screenshots/layers-tab-hierarchy.png)

## Layer model

Each layer in the config has three concerns:

| Concern | Captured by |
|---------|-------------|
| **What it shows** | One or more *data sources* (a service+layer reference, or a direct URL). |
| **Where it lives in the UI** | An *interface group* (and optional *sub-interface group*). |
| **How it looks** | Style: colormap, RGB composite, vector rules, categories, legend, attribution. |

Layers are managed through **Layer Cards**. Each card represents one
selectable item in the deployed Explorer's layer panel.

## Layer types

The builder supports three layer types — **Standard**, **Swipe**, and
**Base** — each with its own page under [Layers](types/index.md). In short:

- **Standard** — toggleable user-facing data overlays. The default for
  almost everything.
- **Swipe** — two rasters compared under a draggable handle.
- **Base** — background basemaps picked from the basemap selector.

## How the tab is laid out

The Layers tab uses a three-level hierarchy:

```text
Interface Group
└── Sub-Interface Group (optional)
    └── Layer Card
        └── Data Source(s)
```

- **Interface groups** are managed in [Settings → Interface Groups](../configuration/interface-groups.md).
  They are the top-level structure shown to users (for example *Land Cover*,
  *Soils*, *Climate*).
- **Sub-interface groups** are declared per layer by typing a name in the
  layer's *Sub-interface group* field. The hierarchy renders automatically.
- **Layer Cards** sit inside groups. Drag them to reorder, double-click move
  buttons to jump to top/bottom.
- **Data Sources** sit inside layer cards. A simple raster layer has one;
  a swipe layer has two (left + right); an RGB composite has three or more.

## Card actions

Each layer card surfaces a small toolbar:

- **Edit** — opens the full layer editor.
- **Duplicate** — clone the card into the same group.
- **Delete** — remove the card (you will be warned if it is the only one in
  its group).
- **Move up / down** — reorder within the group. Double-click moves to the
  top/bottom of the group.

The card itself shows the layer title, the interface group / sub-interface
group it sits in, and metadata badges (data type, statistics availability,
RGB composite, swipe, mirror, spotlight, time-series).

## Empty state

Before any layers exist the tab shows an empty-state panel inviting you to
either **Add Layer** or load an example configuration from the
[Home tab](../home/index.md).

## Next steps

- [Layers](types/index.md) — overview of the three layer types and how to
  choose between them.
- [Standard layers](standard-layers.md) — including the **Add a standard
  layer** walk-through and the Import Layer Card flow.
- [Swipe layers](swipe-layers.md) — side-by-side raster comparison.
- [Base layers](base-layers.md) — basemap-specific guidance.
- [Data visualisation](data-visualisation.md) — colormaps, RGB composite,
  vector rules, categories.
