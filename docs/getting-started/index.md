---
title: Overview
---

# Overview

The Configuration Builder produces a single JSON file — the **config** — that
fully describes an APEx Geospatial Explorer instance: its branding, layout,
the services it talks to, and the layers and charts it shows.

![The Configuration Builder produces a JSON config, hosted in a GitHub repository, which configures the APEx Geospatial Explorer for end users.](../assets/builder-explorer-flow.png)
*The EO Project Team uses the Configuration Builder to author a JSON config (data sources, visualisation, functionality, content, settings). The config is hosted in a GitHub repository and consumed by the APEx Geospatial Explorer to deliver the configured experience to end users.*

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

## The main tabs

The top navigation gives you one tab per major concern:

| Tab          | Purpose |
|--------------|---------|
| **Home**     | Project metadata, config statistics, QA cards, healthcheck entry. |
| **Layers**   | Build the visible content of the APEx Geospatial Explorer. |
| **Draw Order** | Control which layers render on top of which. |
| **Services** | Register and validate endpoints. |
| **Settings** | Layout, interface groups, footer, projections (CRS), advanced options. |
| **JSON Config** | Inspect or edit the raw configuration document. |
| **GE Preview**  | Run the actual APEx Geospatial Explorer inline using your current config. |

## Next steps

- [Build your first config](first-config.md) — a guided walk-through, from blank canvas to exported JSON.
- [Loading and saving](loading-saving.md) — pull in an existing config, or start from the **Comprehensive demo** example.
- [Run Healthcheck](../services/healthcheck.md) — once a config is loaded, this is the fastest sanity check.

!!! tip "Follow along with the demo"
    Most screenshots in this guide were captured with the **Comprehensive
    demo** loaded. Open it from **Home → Load → Examples** to see the same
    state on screen as you read.
