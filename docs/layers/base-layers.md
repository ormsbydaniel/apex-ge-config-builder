---
title: Base layers
---

# Base layers

Base layers are the basemap that sits underneath all other layers on the map. They are managed separately from regular layer cards because only one base layer can be visible at a time, and they typically have no toggleable visibility, no statistics, and no constraints.

## When to use

Use a base layer for any map background the user picks from a basemap selector — for example:

- OpenStreetMap, Carto, or Stamen tile sets (XYZ)
- A WMTS topographic or satellite background
- A custom organisation basemap served as XYZ or WMS

Use a regular layer card instead when the data should be **toggleable**, stack with other layers, or carry styling, statistics, or constraints.

## Configure

In the **Layers tab**, choose **Add Base Layer** (rather than Add Layer). Base layers appear in their own group at the top of the tab.

Each base layer has:

- **Name** — shown in the basemap picker.
- **Preview image** — optional thumbnail (`preview` URL) shown next to the name in the picker.
- **Data source** — usually a single XYZ, WMTS, or WMS source. Multiple sources are allowed but uncommon.
- **Attribution** — required text (and optional link) credited on the map.

Layout, statistics, constraints, and most layer-card controls do not apply. The `isBaseLayer: true` flag at the top of the layer marks it as a basemap rather than a data overlay.

## Validation

- At least one data source is required.
- Attribution text is required.
- The first base layer in the list is the default selection on map load.

## Related

- [Adding layers](adding-layers.md) — adding a regular (non-base) layer.
- [XYZ](../data-sources/xyz.md) and [WMS/WMTS/WFS](../data-sources/wms-wmts-wfs.md) — common base-layer source formats.
