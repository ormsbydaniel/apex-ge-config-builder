---
title: APEx Geospatial Explorer — Configuration Builder
---

# APEx Geospatial Explorer — Configuration Builder

The **Configuration Builder** is a web app for designing, validating, and exporting
configuration files for the APEx Geospatial Explorer viewer. You can use it to
assemble services, layers, charts, and UI options without hand-editing JSON.

This guide is for **config authors** — anyone who builds or maintains a viewer
configuration. It is task-focused: each chapter explains what a feature does,
when to use it, and how to drive it from the UI.

## What you can do with the builder

- Compose a viewer configuration from **services** (WMTS, WMS, WFS, COG, XYZ,
  GeoJSON, FlatGeoBuf, CSV) and **layers** organised into **interface groups**.
- Browse remote catalogues with the **STAC** and **S3** browsers.
- Validate every URL in your config with the **Run Healthcheck** tool and see
  data-access plus performance scores at a glance.
- Style raster layers with colormaps or build **RGB composites**, and style
  vector layers with rule-based filters and stops.
- Author **charts** from CSV, COG pixel values, or vector feature properties.
- Preview the resulting viewer inline before exporting JSON.

## Where to start

If you are new to the app, read [Getting Started → Overview](getting-started/overview.md)
first to learn the core concepts (config, service, layer, interface group).

If you are evaluating an existing config you have just loaded, jump to
[Run Healthcheck](services/healthcheck.md) — it is the quickest way to find
broken or slow layers.

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
