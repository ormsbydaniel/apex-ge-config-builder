---
title: Welcome
---

# Welcome

The **Configuration Builder** is a web app for designing, validating, and exporting
configuration files for the APEx Geospatial Explorer. You can use it to
assemble services, layers, charts, and UI options without hand-editing JSON.

This guide is for **config authors** — anyone who builds or maintains an
APEx Geospatial Explorer configuration. It is task-focused: each chapter
explains what a feature does, when to use it, and how to drive it from the UI.

![The Configuration Builder produces a JSON config, hosted in a GitHub repository, which configures the APEx Geospatial Explorer for end users.](assets/builder-explorer-flow.png)
*The EO Project Team uses the Configuration Builder to author a JSON config (data sources, visualisation, functionality, content, settings). The config is hosted in a GitHub repository and consumed by the APEx Geospatial Explorer to deliver the configured experience to end users.*


## What you can do with the builder

- Compose an APEx Geospatial Explorer configuration from **services** (WMTS, WMS, WFS, COG, XYZ,
  GeoJSON, FlatGeoBuf, CSV) and **layers** organised into **interface groups**.
- Browse remote catalogues with the **STAC** and **S3** browsers.
- Validate every URL in your config with the **Run Healthcheck** tool and see
  data-access plus performance scores at a glance.
- Style raster layers with colormaps or build **RGB composites**, and style
  vector layers with rule-based filters and stops.
- Author **charts** from CSV, COG pixel values, or vector feature properties.
- Preview the resulting APEx Geospatial Explorer inline using **GE Preview** before exporting JSON.

## Where to start

Pick the entry point that matches what you are doing right now:

| If you are…                                              | Start here |
|----------------------------------------------------------|------------|
| New to the builder                                       | [Getting Started → Overview](getting-started/index.md) — core concepts (config, service, layer, interface group). |
| Building your first config from scratch                  | [Build your first config](getting-started/first-config.md) — guided walk-through. |
| Evaluating a config you just loaded                      | [Run Healthcheck](services/healthcheck.md) — fastest way to find broken or slow layers. |
| Looking for a specific feature                           | Use the left-hand nav, grouped by tab (Home, Layers, Services, Settings…). |
| Editing the documentation itself                         | [Authors guide](reference/authors-guide.md). |

## Conventions used in this guide

- **Bold** for UI labels you click or type into.
- `code` for filenames, URL fragments, and JSON field names.
- Screenshots in this guide were captured with the **Comprehensive demo**
  example config loaded — you can load it yourself from
  **Home → Load → Examples** to follow along.
- The terms **layer** and **data source** are used interchangeably; internally
  the config calls them `sources`.
- Coordinate systems are always called **CRS** (Coordinate Reference System),
  never "projection".
