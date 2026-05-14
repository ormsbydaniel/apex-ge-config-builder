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

## Two kinds of layer

The **Add New Layer** screen offers two options:

### Add Layer Card

A configurable layer that appears in the user-facing layer panel. It has:

- One or more data sources (`data`, optional `statistics`, optional swipe /
  mirror / spotlight comparison sources).
- Metadata (title, description, attribution).
- A legend, categories, and UI controls.
- A target interface group and optional sub-interface group.

Use this for almost everything you want a user to be able to toggle on
the map.

### Base Layer

A background basemap. It has no UI controls or metadata and is rendered
underneath everything else. Base layers are listed separately in the
deployed Explorer's basemap picker.

Use this for OSM, satellite imagery, terrain hillshades, and similar
baseline reference layers.

### Import Layer Card (beta)

When you trigger **Add Layer** from inside an existing interface group,
the second tile becomes **Import Layer Card** instead of **Base Layer** —
this lets you copy one or more layer cards from another configuration into
the current group. See [Adding layers](adding-layers.md#import-layer-card-beta).

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

- [Adding layers](adding-layers.md) — walk-through for the **Add Layer Card**
  and **Add Base Layer** flows.
- [Base layers](base-layers.md) — basemap-specific guidance.
- [Data visualisation](data-visualisation.md) — colormaps, RGB composite,
  vector rules, categories.
