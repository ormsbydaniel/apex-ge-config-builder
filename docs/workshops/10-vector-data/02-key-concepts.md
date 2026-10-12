---
title: 10-2. Key concepts
---
# 10-2. Key concepts

Much of the Geospatial Explorer focuses on Earth Observation imagery. Sometimes,
however, vector data is useful contextual information: country boundaries,
roads, power networks or survey areas can help people interpret what they see
in an image. Some outputs from Earth Observation projects also end up as vector
data, for example detected field boundaries or polygons showing areas of
change.

Unlike raster data, which stores values in a grid of pixels, vector data stores
individual features as geometries:

- **Points** represent individual locations.
- **Lines** represent routes or networks.
- **Polygons** represent areas and boundaries.

Each feature can also carry attributes. A country polygon might have a name and
an ISO code; a power line might have a voltage; an air-quality polygon might
have a measured concentration. Vector styling uses these attributes to label
features or vary their colour and appearance.

## GeoJSON and FlatGeoBuf

The exercises use two common vector file formats:

| Format | What it is | When to use it |
|---|---|---|
| **GeoJSON** | A widely supported, human-readable text format based on JSON. | Small to medium datasets that are straightforward to inspect and exchange. |
| **FlatGeoBuf** | A compact binary format with a spatial index, designed for efficient streaming. | Large datasets where loading an entire GeoJSON file would be slow or impractical. |

FlatGeoBuf is much more scalable at large volumes because the Explorer can
request only the parts needed for the current map view. This is particularly
important for the Ukraine field-boundary dataset used in the next exercise,
which contains hundreds of thousands of polygons.

For more detail, see [GeoJSON / FlatGeoBuf](../../data-sources/geojson-flatgeobuf.md)
and [Vector styling](../../layers/vector-styling.md).
