---
title: Services overview
---

# Services overview

A **service** is a reusable endpoint definition. Layers reference services
by name, so you can swap an endpoint URL in one place and have every layer
that uses it pick up the change.

## What a service is

A service captures three things:

1. The **type** of endpoint (WMS, WMTS, WFS, COG, XYZ, GeoJSON, FlatGeoBuf,
   CSV, S3 bucket, or STAC catalogue).
2. The **URL** to reach it.
3. A **name** you choose, used in dropdowns when you build layers.

For OGC services and STAC catalogues, the builder also performs automatic
discovery — `GetCapabilities` for OGC and catalogue metadata for STAC — and
populates the service name for you.

## Where services live

The **Services** tab lists every service in the current config. The header
of the **Configured Services** card has three buttons:

| Button | Purpose |
|--------|---------|
| **Re-check all** | Re-runs validation against every service (STAC, OGC, S3). Useful after editing endpoints. |
| **Add Recommended Services** | Bulk-adds a curated list of common public services. See [Recommended services](recommended.md). |
| **Add Service** | Opens the **Add Service** dialog. See [Adding services](adding-services.md). |

Below the header, each service is shown as a row with its name, URL, type
badge, and per-service validation status.

## Supported service types

| Type | Used for | Discovery |
|------|----------|-----------|
| **WMS** | Map images served per request from a WMS endpoint. | `GetCapabilities` |
| **WMTS** | Pre-tiled raster pyramids. | `GetCapabilities` |
| **WFS** | Vector features served from a WFS endpoint. | `GetCapabilities` |
| **STAC** | Catalogues of imagery and assets. | Catalogue root metadata. |
| **S3** | Public/private S3 buckets containing COG, GeoJSON, FlatGeoBuf, or CSV files. | Bucket listing. |
| **JSON or XML upload (beta)** | One-off ingest of a saved capabilities or catalogue document. | n/a |

Direct-URL data sources (a single COG, GeoJSON, FlatGeoBuf, XYZ, or CSV file)
do not need a service entry — you can add them straight from the
[Layers](../layers/adding-layers.md) tab.

## Validation states

Each service shows one of:

- **OK** — reachable, returned a valid response.
- **Checking…** — a re-check is in flight.
- **Failed** — could not reach the endpoint, or the response was unusable.
  The error message is shown inline.

Use **Re-check all** after a network change or when you suspect an upstream
endpoint has moved.

## When to use services vs. direct URLs

- Use a **service** when the same endpoint will host more than one layer
  (the typical case for WMS/WMTS/WFS/STAC/S3) — you get one URL to maintain.
- Use a **direct URL** when the layer is a single standalone file (a one-off
  COG or GeoJSON). You can still promote it to a service later.

## Next steps

- [Adding services](adding-services.md) — walk-through for adding each type.
- [Recommended services](recommended.md) — bulk-import the curated list.
- [Run Healthcheck](healthcheck.md) — validate every service plus every layer.
