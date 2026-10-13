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
