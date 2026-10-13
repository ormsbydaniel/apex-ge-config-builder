# Tutorial 12: STAC as a data source

A new tutorial that loads the prepared **STAC datasets** configuration and walks
through inspecting STAC data sources and how they behave in the Geospatial
Explorer. No layer building — inspection and understanding only.

## Structure (mirrors Tutorials 9–11)

New folder `docs/workshops/12-stac-data/`:

- `index.md` — "12. STAC as a data source" with objectives and step list
- `01-prerequisites.md` — core links, load instructions, export reminder
- `02-key-concepts.md` — STAC concepts
- `03-inspecting-stac-data-sources.md` — the main exercise
- `04-stac-in-the-preview.md` — behaviour exercise

## Draft: index.md

```markdown
---
title: 12. STAC as a data source
---
# 12. STAC as a data source

## Tutorial Objectives

Many Earth Observation projects publish their results through a STAC
(SpatioTemporal Asset Catalog) catalogue. The Geospatial Explorer can use a
STAC collection, item or query directly as a data source, without downloading
files by hand. In this tutorial you will load a prepared configuration of STAC
layers and inspect how they are defined and how they behave.

By the end of this tutorial you will be able to:

- Explain what STAC is and how catalogues, collections, items and assets relate.
- Recognise a STAC data source on a layer card.
- Inspect STAC collection, item, asset and queryable metadata.
- Understand how area, date and property filters become part of a STAC query.
- Describe how STAC layers behave in the preview, including time series.

## Steps

- [12-1. Pre-requisites](01-prerequisites.md)
- [12-2. Key concepts](02-key-concepts.md)
- [12-3. Inspecting STAC data sources](03-inspecting-stac-data-sources.md)
- [12-4. STAC in the preview](04-stac-in-the-preview.md)
```

## Draft: 01-prerequisites.md

```markdown
---
title: 12-1. Pre-requisites
---

# 12-1. Pre-requisites

Completion of all core tutorials or existing familiarity with the configuration
builder:

- [1. Familiarisation](../01-familiarisation/index.md)
- [2. My first config](../02-getting-started/index.md)
- [3. Working with Services](../03-working-with-services/index.md)

## Load the starting configuration

1. Click **Load** in the Configuration Builder.
2. Open the **Examples** tab.
3. Under **Test & development**, select **STAC datasets**.

This starting configuration contains a set of layers whose data comes straight
from STAC catalogues: a whole collection, single items, filtered item lists,
time series and a search query with a cloud-cover filter.

!!! tip "Export often"
    Export your configuration after each exercise so you can recover your work
    if your browser tab closes.
```

## Draft: 02-key-concepts.md

```markdown
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

## STAC as a data source

When you add STAC to a layer, the configuration stores only:

- the **URL** of the collection, item, item list or search query, and
- the **asset name** and its **format** (for example `data (flatgeobuf)`).

Any filters — area of interest, date range, result limit or property filters
such as `cloud_cover < 10` — are part of that URL. The Explorer resolves the
real file addresses when the layer is used; temporary or signed links are never
saved.

## Items and search endpoints

A STAC service offers two ways to ask for items:

| Endpoint | Shape | Notes |
|---|---|---|
| **Items** | `.../collections/{id}/items?...` | The default. Serves a single collection. |
| **Search** | `.../search?collections={id}&...` | Can span several collections. Some services only evaluate property filters here. |

The query editor lets you switch between the two while keeping your filters,
and its **Test** button shows how many items each endpoint returns, so you can
see whether a server honours your filters.

For more detail, see [STAC browser](../../data-sources/stac-browser.md).
```

## Exercises 12-3 and 12-4 (outline, drafted after you approve the above)

- **12-3 Inspecting STAC data sources**: recognise the `stac` badge and asset
  badge on a layer card; tour the **(i) STAC metadata** dialog (Collection,
  Item, Asset, Queryables tabs); compare the config's layer types (whole
  collection, single item, datetime-filtered list, bbox query, search query
  with `cloud_cover < 10`); open the query editor to see filter badges and the
  Items/Search test.
- **12-4 STAC in the preview**: preview the config; use the time slider on a
  STAC time series; try the swipe comparison layer; note that multi-band and
  vector styling work on STAC assets as on direct files (links back to
  Tutorials 9 and 10).

## Housekeeping

- Register the four pages in `mkdocs.yml`; keep `docs/javascripts/nav-groups.js` in sync.
- Contextual screenshots in first-encounter order via `scripts/add-screenshot.sh`, sized by aspect ratio.
- Rebuild with `mkdocs build --strict`. Not published until asked.

## Note

The STAC datasets config currently sits in the **Test & development** group of
the Examples tab; 12-1 says so. Promoting it to the main Examples list is a
one-line manifest change in the configs repo (optional, separate).
