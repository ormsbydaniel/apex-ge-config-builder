# Tutorial 12: STAC as a data source

A new tutorial that loads the prepared **STAC datasets** configuration and walks
through inspecting STAC data sources and how they behave in the Geospatial
Explorer. No layer building — inspection and understanding only. All content
below is drafted and ready to write on approval.

## Files to create in `docs/workshops/12-stac-data/`

### index.md

```markdown
---
title: 12. STAC as a data source
---
# 12. STAC as a data source

## Tutorial Objectives

Many Earth Observation projects publish their results through a STAC
(SpatioTemporal Asset Catalog) catalogue. As well as browsing a STAC catalogue
to discover data, the Geospatial Explorer can use a STAC collection, item or
query directly as a data source. In this tutorial you will load a prepared
configuration of STAC layers and inspect how they are defined and how they
behave.

By the end of this tutorial you will be able to:

- Explain what STAC is and how catalogues, collections, items and assets relate.
- Describe the difference between STAC as a discovery service and STAC as a data source.
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

### 01-prerequisites.md

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

Tutorial 3 is particularly relevant here: it used a STAC catalogue to discover
data, which this tutorial builds on.

!!! tip "Export often"
    Export your configuration after each exercise so you can recover your work
    if your browser tab closes.
```

### 02-key-concepts.md

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

For more detail, see [STAC browser](../../data-sources/stac-browser.md).
```

### 03-inspecting-stac-data-sources.md

```markdown
---
title: 12-3. Inspecting STAC data sources
---
# 12-3. Inspecting STAC data sources

In this exercise you will load a prepared configuration of STAC layers and
inspect how each data source is defined.

## Load the starting configuration

1. Click **Load** in the Configuration Builder.
2. Open the **Examples** tab.
3. Under **Test & development**, select **STAC datasets**.

The configuration contains a set of layers whose data comes straight from STAC
catalogues, alongside the usual base layers.

## Recognise a STAC data source

1. Open the layer card for **STAC Tillage simple**.
2. Look at its data source row. Two things mark it as STAC:

    - the format badge shows **stac**, and
    - a muted badge on the right names the asset and its real format —
      here `data (flatgeobuf)`.

3. Open a few other layer cards — **Austria LST STAC item**, **Africa
   January 2023**, **Sentinel 2 STAC Query - June 2026** — and note that each
   shows the same pattern: a STAC address plus one named asset.

!!! info "Why the asset badge matters"
    The STAC address only says *where* to ask; the asset badge says *what* the
    Explorer will actually fetch and display. The same collection could offer
    a COG, a FlatGeoBuf and a thumbnail — the badge tells you which one the
    layer uses.

## Inspect the metadata

1. On the **STAC Tillage simple** data source row, click the **(i)** button to
   open **STAC Metadata**.
2. Work through the tabs:

    - **Collection** — the title, description, licence and spatial and
      temporal extents of the whole collection.
    - **Item** — the single item, or the first item returned by the layer's
      filters, with its date, footprint and properties.
    - **Asset** — details of the selected asset, with a button that opens the
      COG or FlatGeoBuf file inspector you met in earlier tutorials.
    - **Queryables** — the properties the collection allows you to filter on.

3. Close the dialog and open the metadata for **Austria LST STAC item**.
   Because this address points at one item, the Item tab describes exactly
   that scene.

!!! info "Read-only"
    The metadata view never changes your configuration, and temporary or
    signed file links are never saved.

## Compare the layer types

The configuration contains one of each common shape. Open each layer card and
compare the data source addresses:

| Layer | Address shape | What it means |
|---|---|---|
| **STAC Tillage simple** | `.../collections/tillage_type_detection` | A whole collection — every item is used. |
| **Austria LST STAC item** | `.../collections/ECOSTRESS_LST/items/ECOSTRESS_MEAN_LST_2024` | One specific item. |
| **Africa January 2023** | `.../items?datetime=2023-01-01.../2023-01-31...&limit=10000` | An item list filtered by date. |
| **Morocco, Time Series** | `.../items?limit=10000&bbox=...` | An item list filtered by area. |
| **Sentinel 2 STAC Query - June 2026** | `.../search?...&filter=cloud_cover < 10&filter-lang=cql2-text` | A search query with area, date *and* a property filter. |

Notice that every filter — area, dates, limit, cloud cover — is part of the
address itself. Nothing about the query is hidden elsewhere in the
configuration.

## Look at the query editor

1. On the **Sentinel 2 STAC Query - June 2026** layer card, edit the data
   source to open the query editor.
2. The filters from the address appear as badges: the area (AOI), the date
   range (TOI), the limit and the `cloud_cover < 10` property filter, plus a
   collection badge.
3. Find the **Query method** choice — **Items endpoint** or **Search
   endpoint** — and the small **Test** button beside each.
4. Click **Test** for each method and compare the results. Some services only
   evaluate property filters on the search endpoint, so the two counts can
   differ; the test tells you whether the server honours your filter.
5. Close the editor without saving.

!!! tip "Export your configuration"
    Save your progress before moving on to the next exercise.
```

### 04-stac-in-the-preview.md

```markdown
---
title: 12-4. STAC in the preview
---
# 12-4. STAC in the preview

STAC layers behave like any other layer once the Explorer is running. In this
exercise you will preview the configuration and watch how the different STAC
layers render and respond.

## Preview the configuration

1. Click **Preview** to open the configuration in the Geospatial Explorer.
2. Turn the STAC layers on and off from the layer menu. Each one renders like
   a directly-added COG or FlatGeoBuf — the Explorer resolves the real file
   addresses from the catalogue behind the scenes.

## Watch a STAC time series

1. Turn on **Austria LST STAC items time series** (or **STAC time series,
   band 2, East Belgium**).
2. Use the time slider to step through the scenes. Each item's own date drives
   the timeline — the layer is a live query, so items added to the collection
   later would appear automatically.
3. Compare this with **Africa January 2023** and **Africa June 2022**: the same
   collection, but each layer's address carries a different date filter, so
   each shows a different slice.

## Try the swipe comparison

1. Turn on the **Swipe test** layer.
2. Drag the swipe control to compare the June 2022 and January 2023 scenes.
   Both sides come from the same STAC collection; only the `datetime` filter
   in each address differs.

## Styling works the same

Everything you learned in Tutorials 9 and 10 applies to STAC assets too:

- A STAC asset that is a COG can be styled with multi-band composites and
  spectral indices — the **Sentinel 2 STAC Query - June 2026 NDWI** layer is
  a STAC query styled with a water index.
- A STAC asset that is GeoJSON or FlatGeoBuf can be styled with the vector
  styling recipes, as on **STAC Tillage simple**.

The Explorer fetches a sample of the data when you open these editors, but
only the STAC address and asset name are ever saved.

!!! tip "Export your configuration"
    Export your finished configuration so you can reload it later.
```

## Housekeeping

- Register the four pages in `mkdocs.yml` under a new "12. STAC as a data source" group.
- Add `"12-stac-data"` to the tutorial list and `"12-stac-data": "12. STAC as a data source"` to `TUTORIAL_TITLES` in `docs/javascripts/nav-groups.js`.
- Add the Tutorial 12 tasks to `roadmap.md`.
- Rebuild with `mkdocs build --strict`. Screenshots can be added in a later pass. Not published until asked.

## Note

The STAC datasets config currently sits in the **Test & development** group of
the Examples tab; 12-3 step 1 says so. Promoting it to the main Examples list
is a one-line manifest change in the configs repo (optional, separate).
