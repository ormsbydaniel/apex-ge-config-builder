---
title: 5-4. Categories for a COG
---
# 5-4. Categories for a COG

The same category system drives rendering for classified COGs.

1. Create a new layer card called `World Cover - Austria` - see tutorial 2-6 for a recap if needed
2. Add the following dataset — a World Cover COG for Austria - see tutorial 2-7 for a recap if needed:

    ```
    https://esa-apex.s3.eu-west-1.amazonaws.com/APEX-example-data/constraints/PowerDensity_100m_Austria_WGS84_COG_clipped_3857_fix-esa_worldcover_2021.tif
    ```

3. Click the **(i)** info icon on the dataset row to open the COG metadata
   dialog.
4. Select **Populate categories**. The categories editor is populated from a
   sample of the pixel values in the COG.

5. Edit a couple of the category labels to align to the World Cover class
   names (e.g. `10 → Tree cover`, `20 → Shrubland`). See https://collections.sentinel-hub.com/worldcover/readme.html for the list of namnes and categories.
6. Save the layer card and preview. The COG is now rendered with the labels
   and colours you defined.

!!! Tip
   For COG files, the categories define the legend and the styling of the COG, so you can pick whatever colours you choose.  If you ommit a category entirely, then it will not display that data.  For example, if you *only* added in the category for tree cover, this is all you would see.

!!! warning "Sampled categories"
    The values are populated from a **sample** of pixels. It is possible for
    a small number of pixels to fall into classes that were not sampled.
    Cross-check against the source data if completeness matters.
