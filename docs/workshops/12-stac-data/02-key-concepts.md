---
title: 12-2. Key concepts
---
# 12-2. Key concepts

STAC (SpatioTemporal Asset Catalog) is a standard way of describing collections
of geospatial data so that software can discover and use them. Many Earth
Observation projects and data portals publish their results as STAC
catalogues.

A STAC catalogue is organised in levels:

- A **catalogue** groups related **collections**.
- A **collection** is a dataset family, for example land surface temperature
  over Austria or a Sentinel 2 archive.
- An **item** is one entry in a collection, usually one scene or one time step,
  with a date, a footprint and some properties (such as cloud cover).
- An **asset** is an actual file belonging to an item — the COG, GeoJSON or
  FlatGeoBuf the Explorer will display.

## Two ways of using STAC

**STAC as a discovery service.** In Tutorial 3 you browsed the Projects
Results Repository (PRR) catalogue to find the Biomass layers. The catalogue
helped you uncover data of interest, and the address of the file you chose was
then added to your configuration directly. The catalogue's job ended at
discovery.

**STAC as a data source.** In this tutorial the STAC catalogue *is* the data
source. The configuration stores a STAC address — a collection, an item, or a
query — and it is the Geospatial Explorer, not the Configuration Builder, that
then goes to the catalogue and fetches the data. Because the catalogue is
consulted at view time, a STAC layer can track a growing collection: new items
that match the query appear automatically.

## What the configuration stores

When you add STAC to a layer, the configuration stores only:

- the **URL** of the collection, item, item list or search query, and
- the **asset name** and its **format** (for example `data (flatgeobuf)`).

Any filters — area of interest, date range, result limit or property filters
such as `cloud_cover < 10` — are part of that URL. Temporary or signed file
links are never saved.

## Items and search endpoints

A STAC service offers two ways to ask for items:

| Endpoint | Shape | Notes |
|---|---|---|
| **Items** | `.../collections/{id}/items?...` | The default. Serves a single collection. |
| **Search** | `.../search?collections={id}&...` | Can span several collections. Some services only evaluate property filters here. |

The query editor lets you switch between the two while keeping your filters,
and its **Test** button shows how many items each endpoint returns, so you can
see whether a server honours your filters.

Property filters are written in one of two styles, depending on what the
catalogue supports: CQL2 (`filter=...`) or the older Query extension
(`query=...`, used by Element 84 Earth Search). The editor picks the right one
automatically.

For more detail, see [STAC browser](../../data-sources/stac-browser.md).
