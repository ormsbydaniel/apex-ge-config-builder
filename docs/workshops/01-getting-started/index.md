---
title: Getting Started workshop
---
# Getting Started workshop

Build a Geospatial Explorer configuration from scratch, connecting to a range of
data sources and services.

## Useful links

- Config Builder: <https://apex-ge-config-builder.sparkgeo.uk/>
- Configuration Builder Guide (this site): <https://apex-ge-config-builder.sparkgeo.uk/guide/>

## Scope

This workshop covers the **Geospatial Explorer Configuration Builder** ("CB")
that is used to create configuration files for the Geospatial Explorer ("GE").

**We will** cover most of the CB's capabilities: building a new configuration
from scratch, connecting to COGs, GeoJSON / FlatGeoBuf, WMS / WMTS and STAC,
setting up categories, time series and constraints.

**We will not** cover how the underlying data sources and services themselves
are created, configured or hosted. The
[APEx interoperability guidelines](https://esa-apex.github.io/apex_documentation/)
describe pre-requisites and best practices for those.

The one data type that is specific to the GE is **statistics**. These use a
standard geospatial format (FlatGeoBuf) but the way the data is structured
inside is GE-specific. This workshop uses statistics datasets that have been
prepared in advance; preparing statistics from scratch is covered separately.

## Pre-requisites

There are no specific technical pre-requisites, although a second monitor is
useful to follow along. It is assumed that delegates have a basic understanding
of:

- Geospatial data — primarily raster (we use COGs) and vector formats
- Geospatial web services — WMS, WMTS and XYZ
- SpatioTemporal Asset Catalogs (STAC), and the concepts of *collections*,
  *items* and *assets*

If you are unfamiliar with the above the workshop is still useful, but some
areas may need extra explanation from the facilitator.

## Exercises

The workshop is split into short exercises. Use the **Next** arrow at the
bottom of each page to move through them in order.

**Part 1 — Mastering the basics**

1. [Key concepts](01-key-concepts.md)
2. [Name, interface group and branding](02-name-and-branding.md)
3. [Exporting and reloading config](03-export-and-reload.md)
4. [Add recommended base maps](04-add-base-maps.md)
5. [Your first layer card](05-first-layer-card.md)
6. [Add a COG data source](06-add-cog-data.md)
7. [Style with a colormap](07-colormaps.md)
8. [Experiment with layer controls](08-layer-controls.md)

**Part 2 — Web services (WMS / WMTS / STAC) and the PRR**

9. [Add a WMS layer directly](09-wms-service.md)
10. [Add recommended services](10-recommended-services.md)
11. [Add data from the PRR](11-data-from-prr.md)
12. [Add more WMS layers](12-more-wms-layers.md)
13. [Add legends for a WMS](13-wms-legends.md)

**Part 3 — Working with categorical data**

14. [Categories — key concepts](14-categories-intro.md)
15. [Categories for a WMS layer](15-categories-wms.md)
16. [Categories for a COG](16-categories-cog.md)
17. [Use the JSON editor](17-categories-json-editor.md)
18. [Copy categories between layers](18-copy-categories.md)

**Part 4 — Working with time series data**

19. [Time series — key concepts](19-time-series-intro.md)
20. [The temporal control with manual timestamps](20-manual-timestamps.md)
21. [Using STAC timestamps](21-stac-timestamps.md)
22. [Using WMS / WMTS time parameters](22-wms-timestamps.md)
23. [Manual timestamps on WMS / WMTS](23-manual-wms-timestamps.md)

**Part 5 — Working with constraints**

24. [Constraints — key concepts](24-constraints-intro.md)
25. [Create a categorical constraint](25-categorical-constraint.md)
26. [Add a set of continuous constraints](26-continuous-constraints.md)

!!! tip "Export often"
    There is no cloud "save" — you save by exporting your configuration to your
    local machine. Export after every couple of exercises so you can recover if
    your browser tab closes.
