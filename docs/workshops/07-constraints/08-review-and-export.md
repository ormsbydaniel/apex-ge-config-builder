---
title: 7-8. Review the full configuration
---
# 7-8. Review the full configuration

## What you built

Your layer now carries seven constraints on a single COG data source:

- one **categorical** constraint (land cover),
- five **continuous** constraints (elevation, slope, ruggedness, distance to
  power line, distance to settlement),
- one **combined** constraint (altitudinal zones).

Each constraint was given a **band index** automatically, in the order the
constraints were added. You do not need to set these by hand, but you will see
them in the exported JSON.

## Reference JSON

Use the per-layer **{JSON}** editor to compare your layer against the finished
version below — or paste it in wholesale if you want to skip ahead.

```json
{
  "id": "austria-wind-power-density-at-100m",
  "name": "Austria Wind Power Density at 100m",
  "isActive": false,
  "data": [
    {
      "url": "https://eox-gtif-public.s3.eu-central-1.amazonaws.com/DHI/PowerDensity_100m_Austria_WGS84_COG_clipped_3857_fix.tif",
      "format": "cog",
      "zIndex": 50
    }
  ],
  "constraints": [
    {
      "url": "https://eox-gtif-public.s3.eu-central-1.amazonaws.com/DHI/Copernicus_DSM_COG_10m_3857_fix.tif",
      "format": "cog",
      "label": "Elevation",
      "type": "continuous",
      "interactive": true,
      "min": 0,
      "max": 4000,
      "units": "meters",
      "bandIndex": 2
    },
    {
      "url": "https://eox-gtif-public.s3.eu-central-1.amazonaws.com/DHI/Copernicus_DSM_COG_10m_3857_fix.tif",
      "format": "cog",
      "label": "Altitudinal zones",
      "type": "combined",
      "interactive": true,
      "units": "meters",
      "constrainTo": [
        { "label": "0 to 1000",    "min": 0,    "max": 1000 },
        { "label": "1001 to 2000", "min": 1001, "max": 2000 },
        { "label": "2001 to 3000", "min": 2001, "max": 3000 },
        { "label": "> 3000",       "min": 3001, "max": 4000 }
      ],
      "bandIndex": 3
    },
    {
      "url": "https://eox-gtif-public.s3.eu-central-1.amazonaws.com/DHI/Copernicus_10m_DSM_COG_Slope_3857_fix.tif",
      "format": "cog",
      "label": "Slope",
      "type": "continuous",
      "interactive": true,
      "min": 0,
      "max": 65,
      "units": "degrees",
      "bandIndex": 4
    },
    {
      "url": "https://eox-gtif-public.s3.eu-central-1.amazonaws.com/DHI/RuggednessIndex_Austria_3857_COG_fix.tif",
      "format": "cog",
      "label": "Ruggedness Index",
      "type": "continuous",
      "interactive": true,
      "min": 0,
      "max": 1,
      "units": "index values",
      "bandIndex": 5
    },
    {
      "url": "https://eox-gtif-public.s3.eu-central-1.amazonaws.com/DHI/PowerLineHigh_EucDist_Austria_3857_COG_fix.tif",
      "format": "cog",
      "label": "Distance to High Power Line",
      "type": "continuous",
      "interactive": true,
      "min": 0,
      "max": 30000,
      "units": "meters",
      "bandIndex": 6
    },
    {
      "url": "https://eox-gtif-public.s3.eu-central-1.amazonaws.com/DHI/WSF_EucDist_Austria_3857_COG_fix.tif",
      "format": "cog",
      "label": "Distance to settlement (WSF)",
      "type": "continuous",
      "interactive": true,
      "min": 0,
      "max": 5500,
      "units": "meters",
      "bandIndex": 7
    },
    {
      "url": "https://esa-apex.s3.eu-west-1.amazonaws.com/APEX-example-data/constraints/PowerDensity_100m_Austria_WGS84_COG_clipped_3857_fix-esa_worldcover_2021.tif",
      "format": "cog",
      "label": "Land Cover (from World Cover)",
      "type": "categorical",
      "interactive": true,
      "constrainTo": [
        { "label": "Tree cover", "value": 10 },
        { "label": "Shrubland", "value": 20 },
        { "label": "Grassland", "value": 30 },
        { "label": "Cropland", "value": 40 },
        { "label": "Built-up", "value": 50 },
        { "label": "Bare", "value": 60 },
        { "label": "Snow and ice", "value": 70 },
        { "label": "Permanent water bodies", "value": 80 },
        { "label": "Herbaceous wetland", "value": 90 },
        { "label": "Moss and lichen", "value": 100 }
      ],
      "bandIndex": 8
    }
  ],
  "meta": {
    "description": "The wind power density (w m 2) is a measure of the available wind resource at 100 meters height. Higher wind power density indicates greater wind power potential. Constraints allow the data to be filtered by multiple criteria.",
    "attribution": {
      "text": "ESA GTIF",
      "url": "https://gtif.esa.int/"
    },
    "categories": [],
    "units": "w / m 2",
    "colormaps": [
      {
        "min": 0,
        "max": 2000,
        "steps": 50,
        "name": "jet",
        "reverse": false
      }
    ]
  },
  "layout": {
    "interfaceGroup": "Energy",
    "subinterfaceGroup": "Austria Green Transition",
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
        "zoomToCenter": true,
        "temporalControls": false,
        "constraintSlider": true,
        "blendControls": false
      }
    }
  }
}
```

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| The layer disappears entirely as soon as a constraint is added | The constraint COG does not share the CRS, resolution and origin of the primary data. |
| No constraint controls appear in the viewer | **Constraint slider** is off in the layer card controls. |
| A checkbox is ticked but nothing changes | The `value` does not match a pixel code in the constraint COG. |
| A slider covers the wrong range | Min/max were not populated, or were populated from a different band. |
| Nothing renders with several constraints active | Constraints are combined with AND — the filters may be mutually exclusive. |

### Did you remember to export?

That's the last of the tutorials — but a good final export never hurts.

Congratulations — you've built a complete Geospatial Explorer configuration
from scratch!
