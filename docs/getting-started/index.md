---
title: Overview
status: draft
---
# Overview

The Configuration Builder produces a single JSON file — the **config** — that
fully describes an APEx Geospatial Explorer instance: its branding, layout,
the services it talks to, and the layers and charts it shows.

## The main tabs

The top navigation gives you one tab per major concern.

![The main tab bar across the top of the Configuration Builder](../assets/screenshots/main-tabs-bar.png)

| Tab | Purpose |
|-----|---------|
| **[Home](../home/index.md)** | The project dashboard — load and save configurations, edit project metadata, see what your config contains at a glance, and launch the healthcheck. |
| **[Layers](../layers/index.md)** | Build the visible content of your APEx Geospatial Explorer — every map layer, its data source(s), how it is styled, and where it appears in the UI. |
| **[Draw Order](../configuration/draw-order.md)** | Control the front-to-back stacking of layers on the map. Each layer's position here determines its `zIndex` in the rendered map. |
| **[Services](../services/index.md)** | Register and validate reusable endpoint definitions (WMS, WMTS, WFS, COG, XYZ, GeoJSON, FlatGeoBuf, CSV, S3, STAC). Layers reference services by name, so you can swap an endpoint URL in one place. |
| **[Settings](../settings/index.md)** | Top-level configuration that applies to the whole APEx Geospatial Explorer instance: export filename, design variant, navigation defaults, custom CRS, branding, footer links, interface groups, and URL parameters reference. |
| **[JSON Config](../configuration/json-config.md)** | Inspect the raw configuration document as it would be exported, or paste in a configuration to load. URLs are sanitised in the preview. |
| **[GE Preview](../configuration/preview.md)** | Run the actual APEx Geospatial Explorer inline using your current config — the fastest way to confirm a layer renders, a colormap looks right, or the layer panel reads sensibly before shipping. |

## Core concepts

### Config

The whole document you are editing. You can load one from disk, from a GitHub
repo, or from a URL, and you can export it back to JSON at any time. See
[Loading and saving](loading-saving.md).

### Service

A reusable endpoint definition (WMTS, WMS, WFS, COG, XYZ, GeoJSON,
FlatGeoBuf, CSV, S3 bucket, or STAC catalogue). Services are declared once
and referenced by name from layers, so you can swap an endpoint URL in one
place. Managed from the **Services** tab.

### Layer (data source)

A renderable thing on the map. A layer points at one or more service URLs
(`data` and optional `statistics`), specifies how it should be styled, and
declares which **interface group** it belongs to. Layers are managed from the
**Layers** tab.

### Interface group

A user-facing grouping in the APEx Geospatial Explorer's layer panel — for example
"Land Cover", "Soils", "Climate". Interface groups give the APEx Geospatial Explorer's
UI its top-level structure. Manage them from **Settings → Interface Groups**.

### Base layer

A special layer type used for the underlying basemap (OSM, satellite, etc.).
Base layers are listed separately in the layers panel and exported into a
distinct part of the config.

### Healthcheck

A built-in tool that probes every URL in your config and reports
per-layer **Data Access** and **Performance** scores. See
[Run Healthcheck](../services/healthcheck.md).


## Next steps

- [Build your first config](first-config.md) — a guided walk-through, from blank canvas to exported JSON.
- [Loading and saving](loading-saving.md) — pull in an existing config, or start from the **Comprehensive demo** example.
- [Run Healthcheck](../services/healthcheck.md) — once a config is loaded, this is the fastest sanity check.

!!! tip "Follow along with the demo"
    Most screenshots in this guide were captured with the **Comprehensive
    demo** loaded. Open it from **Home → Load → Examples** to see the same
    state on screen as you read.
