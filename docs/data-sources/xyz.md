---
title: XYZ
status: draft
---
# XYZ (Tile Service)

A simple URL template that returns a tile per `{z}/{x}/{y}` coordinate.
Used for raster basemaps and pre-rendered overlays.

## When to use

- Raster basemaps from providers like Mapbox, Stadia, OpenStreetMap, or
  your own tile cache.
- Static raster overlays that are already pre-rendered to a `{z}/{x}/{y}`
  pyramid.

## Add an XYZ source

Layer Card → **Datasets → Add Dataset** → **Direct Connection** → set
**Data Format** to **XYZ (Tile Service)**.

| Field | What to fill in |
|-------|-----------------|
| Data Source URL | A URL template containing `{z}`, `{x}`, `{y}`. Example: `https://tile.openstreetmap.org/{z}/{x}/{y}.png`. |
| Z-Index | Default 50. Lower this to send the layer to the back when adding it as a basemap. |

There is no service-backed flow for XYZ — it's always a direct URL.

## As a base layer

For map basemaps you usually want **Add Layer → Base Layer** instead of a
full layer card. The base layer form is a slim variant of the data source
form: just title, URL, and optional attribution. See
[Base layers](../layers/base-layers.md).

## Validation

- The healthcheck fetches a sample tile (typically `0/0/0`) and confirms
  it returns 200 with an image content type.
- Subdomain templates like `{s}.example.com` are not auto-rotated by the
  builder; supply a single concrete subdomain in the URL.

## Tips

- Always include a tile-server attribution string — many providers require
  it. Add it via the layer card's **Description & Attribution** section.
- If the deployed Explorer renders blank tiles only at high zoom, the
  layer's max-zoom probably exceeds the provider's. Limit zoom in the
  layer's **Constraints** if needed.
