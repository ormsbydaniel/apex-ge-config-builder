---
title: 9-8. Multi-spectral time series
---

# 9-8. Multi-spectral time series

Everything you have done in this tutorial with a single scene can also be applied to a **time series** of scenes. If a layer has several dated multi-spectral datasets, the same composite or index style is applied to each date. Users can then step through the dates with the time slider and watch the landscape change.

The pre-requisites configuration includes a time series of Sentinel 2 scenes over **East London and the Thames Estuary**. The area contains dense urban land, marshes, mudflats, reservoirs and farmland. Many of these change through the seasons and with the tide, so it is a good place to explore change over time.

!!! info "Before you start"
    If you have not built a time series layer before, review [6. Time Series](../06-time-series/index.md) first. That tutorial explains how timestamps are attached to datasets, whether set manually or taken from STAC.

## Steps

1. Find the **East London and Thames Estuary** layer and open its **Datasets** tab. Check that it holds several dated COG datasets, each with a timestamp.
2. Click the multi-band **pencil** and apply a **Natural colour** composite, as in 9-3. Use a stretch such as **Mean ± σ** so that the scenes look bright enough.
3. **Save**, open **Preview**, switch the layer on and use the **time slider** to step through the dates.

!!! info "One style, many dates"
    By default, every dataset uses the same settings as the first COG. This keeps the dates comparable: a change in colour reflects a change on the ground, not a change in stretch. You can give a dataset its own settings if one scene is much brighter or darker, but use this sparingly.

## Suggested layers to add

Duplicate the layer, as in 9-4, for each visualisation you want to compare. Add them to an exclusivity set so that only one shows at a time.

| Visualisation | Type | What to look for over time |
| --- | --- | --- |
| **False colour infrared** | Composite | Seasonal green-up of farmland and marshes in Essex and Kent shows as changing reds. |
| **Urban / geology** | Composite | Development and construction sites around the Docklands and Thames Gateway. |
| **Vegetation (NDVI)** | Index | Crop growth and harvest cycles; parks greening in spring. |
| **Water (NDWI)** or **MNDWI** | Index | Reservoirs and the estuary; mudflats exposed or covered depending on the tide at capture time. |

## Optional: add charts

- Add a **Pixel Values** chart, as in 9-7, to compare spectral signatures on a chosen date.
- Add a **Pixel Time Series** chart to show how one band changes at a point across all the dates. See [Pixel time series](../../charts/pixel-time-series.md).

!!! warning "Clouds and tides"
    Not every scene is clear. Cloud, haze and the state of the tide can all make a scene look very different. Before reading a change as real, check whether it shows up across more than one date.

### Did you remember to export?

Export your configuration now so you don't lose your work.
