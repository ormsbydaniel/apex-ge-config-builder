---
title: 8-7. Preview and review
---
# 8-7. Preview and review

## View the result

Open the **Preview** and turn the layer on.

1. Select the **Statistics** tab in the info panel.
2. Zoomed out over Europe, click a **country** — the level 0 boundaries are
   active, and you see the land cover breakdown for that whole country.
3. Zoom in and click again. As the map zoom increases, the Explorer switches to
   the finer NUTS levels, and the breakdown becomes that of a region rather
   than a country.
4. Compare two neighbouring regions to see how the class proportions change.

## Reference JSON

Use the per-layer **{JSON}** editor to compare your layer against the finished
version below — or paste it in wholesale if you want to skip ahead.

```json
{
  "id": "world-cover-2021-with-statistics",
  "name": "World Cover 2021 with statistics",
  "isActive": false,
  "data": [
    {
      "url": "https://mapproxy.terrascope.be/mapproxy/service",
      "format": "wms",
      "zIndex": 50,
      "layers": "esa-worldcover-map-10m-2021-v2_map",
      "parameters": {
        "version": "1.3.0"
      },
      "useTimeParameter": true
    }
  ],
  "statistics": [
    {
      "url": "https://esa-apex.s3.eu-west-1.amazonaws.com/APEX-example-data/HI-RES-NUTS/stats.esa_worldcover_2021.nuts_2024.epsg4326.level00.fgb",
      "format": "flatgeobuf",
      "zIndex": 100,
      "level": 0
    },
    {
      "url": "https://esa-apex.s3.eu-west-1.amazonaws.com/APEX-example-data/HI-RES-NUTS/stats.esa_worldcover_2021.nuts_2024.epsg4326.level01.fgb",
      "format": "flatgeobuf",
      "zIndex": 100,
      "level": 1
    },
    {
      "url": "https://esa-apex.s3.eu-west-1.amazonaws.com/APEX-example-data/HI-RES-NUTS/stats.esa_worldcover_2021.nuts_2024.epsg4326.level02.fgb",
      "format": "flatgeobuf",
      "zIndex": 100,
      "level": 2
    },
    {
      "url": "https://esa-apex.s3.eu-west-1.amazonaws.com/APEX-example-data/HI-RES-NUTS/stats.esa_worldcover_2021.nuts_2024.epsg4326.level03.fgb",
      "format": "flatgeobuf",
      "zIndex": 100,
      "level": 3
    }
  ],
  "meta": {
    "description": "A 10 meter resolution global land cover product for the year 2021, developed and validated in near-real time based on Sentinel-1 and Sentinel-2 data.  Data is provided with statistics for NUTS (Nomenclature of territorial units for statistics) boundaries.  Select the \"statistics\" tab and click on a feature to view.",
    "attribution": {
      "text": "World Cover Project",
      "url": "https://esa-worldcover.org/"
    },
    "categories": [
      { "color": "#006400", "label": "Tree cover", "value": 10 },
      { "color": "#ffbb22", "label": "Shrubland", "value": 20 },
      { "color": "#ffff4c", "label": "Grassland", "value": 30 },
      { "color": "#f096ff", "label": "Cropland", "value": 40 },
      { "color": "#ff0000", "label": "Built-up", "value": 50 },
      { "color": "#b4b4b4", "label": "Bare", "value": 60 },
      { "color": "#f0f0f0", "label": "Snow and ice", "value": 70 },
      { "color": "#0064c8", "label": "Permanent water bodies", "value": 80 },
      { "color": "#0096a0", "label": "Herbaceous wetland", "value": 90 },
      { "color": "#00cf75", "label": "Mangroves", "value": 95 },
      { "color": "#fae6a0", "label": "Moss and lichen", "value": 100 }
    ]
  },
  "layout": {
    "interfaceGroup": "Land Cover",
    "subinterfaceGroup": "World Cover",
    "contentLocation": "infoPanel",
    "layerCard": {
      "toggleable": true
    },
    "infoPanel": {
      "legend": {
        "type": "swatch"
      },
      "controls": {
        "opacitySlider": true,
        "zoomToCenter": false,
        "temporalControls": true,
        "constraintSlider": false,
        "blendControls": true
      }
    }
  },
  "exclusivitySets": [
    "worldcover"
  ],
  "timeframe": "Years"
}
```

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| No **Statistics** tab in the panel | The layer has no `statistics` entries, or the content location is not **Info panel**. |
| Clicking a feature does nothing | The statistics file failed to load — check the URL in the browser, and check the host allows cross-origin requests. |
| Boundaries in the wrong place | The statistics file is not in the CRS the Explorer expects; republish it in EPSG:4326. |
| Same boundaries at every zoom | Duplicate or missing `level` values — levels must run `0, 1, 2, …`. |
| Numbers show but have no labels or colours | The layer has no `categories`; see [8-3](03-world-cover-layer.md). |
| Boundaries hidden under the raster | The statistics `zIndex` is below the display data's `zIndex`. |

## What you built

A land cover layer with four levels of pre-computed zonal statistics, so users
can interrogate the data by administrative area at whatever scale they are
working at.

### Did you remember to export?
