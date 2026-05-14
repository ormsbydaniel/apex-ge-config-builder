---
title: GeoJSON / FlatGeoBuf
---

# GeoJSON / FlatGeoBuf

Two vector formats served as a single static file over HTTPS. GeoJSON is
the lingua franca; FlatGeoBuf (`.fgb`) is its high-performance binary
cousin.

## When to use

| Format | Use for |
|--------|---------|
| **GeoJSON** | Small to mid-size feature collections (≲ a few MB), authoring tools, hand-edited data. |
| **FlatGeoBuf** | Anything bigger. Streamed via HTTP range requests, indexed for spatial queries — much faster than equivalent GeoJSON. |

Both work as the **Data** source of a vector layer and as the
**Statistics** source for zonal-statistics overlays on raster layers (see
[Statistics](../statistics/overview.md)).

## Add a GeoJSON or FlatGeoBuf source

Layer Card → **Datasets → Add Dataset** → **Direct Connection**. Set
**Data Format** to **GeoJSON** or **FlatGeoBuf** and paste the URL.

| Field | Notes |
|-------|-------|
| Data Source URL | Public HTTPS URL ending in `.geojson`, `.json`, or `.fgb`. |
| Z-Index | Default 50. |

You can also pick the file from an [S3 browser](s3-browser.md) — the
format is auto-detected from the extension.

## Vector fields

Once the source is set, open **Vector fields** (or click *Add Fields* in
the layer card) to auto-populate the field list from the data. The
builder reads the first feature for GeoJSON, or the FlatGeoBuf header,
and lists all property names with detected types. See
[Vector fields](../layers/vector-fields.md).

## Visualisation

Pick one styling tool in the layer card:

- **Vector styling** — rule-based fills, strokes, point symbols.
- **Categories** — colour features by a discrete property value.

For polygon layers consider **Statistics** instead — pre-computed zonal
stats are much faster than re-styling on every viewport change.

## Validation

- The healthcheck issues a HEAD request and confirms the file is reachable
  and returns the expected content type.
- For FlatGeoBuf, the spatial index is sniffed; un-indexed `.fgb` files
  still work but lose the streaming benefit.

## Tips

- Convert any GeoJSON over a few MB to FlatGeoBuf — same content, an order
  of magnitude faster.
- Keep property names short and snake_case; they appear unmodified in the
  deployed Explorer's info panel.
- Strip very large per-feature geometry (multi-thousand-vertex polygons)
  by simplifying upstream — it speeds up rendering noticeably.
