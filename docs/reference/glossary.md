---
title: Glossary
status: draft
---
# Glossary

Definitions of terms used throughout this guide and in the builder UI.

### APEx Geospatial Explorer
The end-user web map application that consumes the configuration produced
by this builder. Often shortened to **explorer** or **GE**.

### BIP / BSQ
Two pixel interleave layouts for multi-band raster files.
**BIP** (Band Interleaved by Pixel) stores all bands for one pixel
together — fast for spectral lookups at a point. **BSQ** (Band
Sequential) stores one full band, then the next — fast for whole-band
operations. The builder auto-detects the layout from a COG's IFDs and
adjusts pixel-value extraction accordingly.

### COG
**Cloud Optimized GeoTIFF.** A GeoTIFF organised into internal tiles and
overviews so HTTP range requests can fetch the bytes needed for a given
viewport without downloading the whole file. The preferred raster format
for APEx layers.

### Configuration / config
The JSON document this builder produces. Drives the explorer's services,
layers, interface groups, charts, statistics, constraints, and layout.

### CRS
**Coordinate Reference System.** Identifies how coordinates map to the
Earth's surface — for example `EPSG:3857` (Web Mercator) or `EPSG:4326`
(WGS 84 lat/lng). Used throughout the builder; we deliberately avoid the
older term *projection*.

### Data source
A reference to where layer data comes from — a COG URL, a WMS layer
name, an S3 object, a CSV, etc. Distinct from a **service**: a service
is the endpoint, a data source is one specific dataset on that
endpoint.

### FGB / FlatGeoBuf
A binary, streamable vector format with built-in spatial indexing. Like
GeoJSON but faster and seekable over HTTP range requests.

### Interface group
A user-facing grouping of layers in the explorer's sidebar. Configurable
on the **Layers** tab. Activating an interface group toggles every
layer it contains.

### Sub-interface group
An optional second level of grouping inside an interface group. Used to
build a three-level hierarchy in the explorer sidebar — see
[Sub-interface group hierarchy](../configuration/interface-groups.md).

### Layer
A renderable map item with a data source, styling, and metadata. Layers
sit inside interface groups and are managed on the **Layers** tab.

### Meta
The `meta` object in the configuration. Holds reusable definitions —
projections, colormaps, categories, vector field schemas — that layers
reference by name.

### Plotly
The charting library that renders **Charts** in the explorer. Trace and
layout settings configured in the [Visual editor](../charts/visual-editor.md)
map directly to Plotly's trace/layout JSON.

### Service
A reusable endpoint definition managed on the **Services** tab. Services
play one of two roles today:

- **WMS / WMTS / WFS** services are referenced live by layers — the chosen
  layer from the service is the data source, and editing the service URL
  re-points every layer that uses it.
- **STAC catalogues** and **S3 buckets** act as discovery aids in the
  builder UI. The resolved direct URL of each picked asset is what is
  written into the config; the catalogue/bucket entry can be removed
  afterwards without breaking the layers built from it.

Support for referencing a **STAC collection** itself as a live data source
(for example, to drive the temporal control with a time series) is planned
for a future release.

### STAC
**SpatioTemporal Asset Catalog.** A JSON specification for cataloguing
geospatial assets. The builder browses STAC catalogues to find
collections and items, then materialises selected assets as data
sources.

### Sub-interface group
See **Interface group**.

### Viewer bundle
The compiled APEx Geospatial Explorer that the **Preview** tab embeds
in an iframe. Versions are pinned per config so a config built against
`3.5.0` keeps rendering against `3.5.0` even after newer bundles ship.

### Zod
The runtime schema validation library used by `useValidatedConfig` and
the [JSON Config tab](../configuration/json-config.md). Defines the
canonical shape of every config field — see the
[JSON schema reference](json-schema.md).
