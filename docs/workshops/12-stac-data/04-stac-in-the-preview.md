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
