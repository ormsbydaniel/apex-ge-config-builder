---
title: Data sources overview
---
# Data sources overview

A **data source** tells a layer *where* its content comes from. Each layer can carry one or more data sources, and the source type determines which renderer the APEx Geospatial Explorer uses.

The builder supports the following source types:

| Type | Use for |
|---|---|
| [COG](cog.md) | Cloud Optimized GeoTIFFs streamed from object storage. The preferred raster format. |
| [WMS / WMTS / WFS](wms-wmts-wfs.md) | Layers served by an OGC web service. |
| [XYZ](xyz.md) | Pre-rendered raster tile pyramids (e.g. basemaps). |
| [GeoJSON / FlatGeoBuf](geojson-flatgeobuf.md) | Vector features for points, lines, and polygons. |
| [CSV](csv.md) | Tabular point data with lat/lon columns. |
| [S3 browser](s3-browser.md) | Pick COGs, GeoJSON, or FlatGeoBuf files from an S3-compatible bucket. |
| [STAC browser](stac-browser.md) | Discover items and assets from a STAC catalog. |

See each page for the configuration fields, supported MIME types, and any service-specific behaviour.
