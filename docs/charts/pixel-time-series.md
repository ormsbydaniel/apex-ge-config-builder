---
title: Pixel time series
status: draft
---
# Pixel time series

The **Pixel Time Series** chart source plots one band's pixel value over time. When a user clicks a location on the map, the Geospatial Explorer samples the chosen band from every dated dataset in the layer and draws date against value.

## When to use

- A layer built as a time series from multiple Cloud Optimized GeoTIFFs, one per date.
- Tracking change at a point: land cover class, biomass, an index value.

Contrast with [Pixel values](pixel-values.md), which plots all bands of a *single* COG at one moment (a spectral signature).

## Prerequisites

The source type stays greyed out until the layer has **more than one COG dataset with timestamps**. Add the datasets on the layer's **Datasets** tab and give each one a timestamp first — see [Time series layers](../layers/time-series.md).

## Configure

1. In the layer's **Charts** tab, click **Add Chart** and choose **Pixel Time Series**.
2. Pick the **Band** to sample. Bands are detected from the first dated COG on the layer.
3. Set the title, trace name and styling, and the axis titles under **Chart configuration**.
4. The preview shows placeholder values against the layer's real dates — the builder does not fetch pixels per date.

## JSON

```json
"charts": [
  {
    "title": "Pixel time series",
    "traces": [
      { "name": "Land cover class", "mode": "lines+markers" }
    ],
    "layout": {
      "height": 360,
      "xaxis": { "title": { "text": "Date" }, "type": "category" },
      "yaxis": { "title": { "text": "Class value" } }
    },
    "sources": [
      { "type": "pixelTimeSeries", "bandIndex": 0 }
    ]
  }
]
```

`bandIndex` is zero-based: `0` is Band 1. No `x` is written — the dates come from the layer's datasets at runtime.

## Related

- [Charts overview](overview.md)
- [Pixel values](pixel-values.md)
- [Time series layers](../layers/time-series.md)
