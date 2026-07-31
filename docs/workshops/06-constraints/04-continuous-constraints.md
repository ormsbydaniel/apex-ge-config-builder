---
title: 6-4. Add a set of continuous constraints
---
# 6-4. Add a set of continuous constraints

In the interests of time, this exercise skips manual entry and pastes a full
layer card with a rich set of constraints already configured.

1. Add a new layer card and call it `temp` for now.
2. Open the per-layer **{JSON}** editor and replace its contents with the
   entire JSON below:

    ```json
    {
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
        }
      ],
      "meta": {
        "description": "The wind power density (w m 2) is a measure of the available wind resource at 100 metres height. Higher wind power density indicates greater wind power potential. Constraints allow the data to be filtered by multiple criteria.",
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

3. Apply the changes. You will now have a layer called *Austria Wind Power
   Density at 100m*.
4. Explore the **Constraints** tab of the new layer to see how each of the
   continuous, combined and categorical constraints is configured.

### Did you remember to export?

That's the last of the tutorials — but a good final export never hurts.

Congratulations — you've built a complete Geospatial Explorer configuration
from scratch!
