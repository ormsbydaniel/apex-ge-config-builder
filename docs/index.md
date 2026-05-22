---
title: Welcome
---
# Welcome

The **APEx Geospatial Explorer** is an interactive web map application used to display and visualise outputs from Earth Observation projects.  EO Project teams typically use the **"GE"** to support the communication of their results with interested stakeholders.

The user interface structure, the content that it serves and the functionality presented in a given GE "instance" are all defined in a **JSON** configuration file that the **GE** reads at run time.  A **GE Configuration Builder** tool has been produced that allows **config authors** - anyone who builds or maintains a **GE** configuration - to develop and maintain a config file, *without* needing familiarity with JSON or the specific schema that the **GE** uses.   This guide provides a task focussed explanation on what the configuration builder tool does and how to use it.

![The Configuration Builder produces a JSON config, hosted in a GitHub repository, which configures the APEx Geospatial Explorer for end users.](assets/builder-explorer-flow.png)
*The EO Project Team uses the Configuration Builder to author a JSON config (data sources, visualisation, functionality, content, settings). The config is hosted in a GitHub repository and consumed by the APEx Geospatial Explorer to deliver the configured experience to end users.*


## What you can do with the builder

- Compose an APEx Geospatial Explorer configuration from **data sources** and **services** (WMTS, WMS, WFS, COG, XYZ,
  GeoJSON, FlatGeoBuf, CSV) using **layers** organised into **interface groups**
- Define the **background maps** that are available
- Style raster layers with **categories** and **colormaps**, build **RGB composites** and **style
  vector layers** with rule-based filters and stops.
- Define **statistics** and **constraint** layers
- Author **charts** from CSV, COG pixel values, or vector feature properties.
- Configure specific **functional controls** for each layer - e.g opacity slider, download links
- Browse remote catalogues with the **STAC** and **S3** browsers.
- Inspect the **metadata** of data sources to understand their content
- Validate every URL in your config with the **Run Healthcheck** tool and see
  data-access plus performance scores at a glance.
  - Define specific **branding** and **navigation defaults** (e.g. projection; start location and scale)   
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
