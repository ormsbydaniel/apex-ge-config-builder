---
title: 5-3. Categories for a COG
---
# 5-3. Categories for a COG

The category system determines how COGs are rendered when their values represent a data classification (as opposed to a continuous variable).

1. Create a new layer card called `World Cover - Austria` in the **Land Cover** interface group - see tutorial 2-6 for a recap if needed
2. Add the following dataset — a World Cover COG for Austria - see tutorial 2-7 for a recap if needed:

    ```
    https://esa-apex.s3.eu-west-1.amazonaws.com/APEX-example-data/constraints/PowerDensity_100m_Austria_WGS84_COG_clipped_3857_fix-esa_worldcover_2021.tif
    ```

3. Click the **(i)** info icon on the dataset row to open the COG metadata
   dialog.

    ![COG metadata dialog showing categorical statistics and the embedded colour palette](../../assets/screenshots/cog-categories-metadata.png)

4. Select **Populate categories**. The categories editor is populated from a
   sample of the pixel values in the COG.

    Alternatively, if the COG has an embedded colour palette, select
    **Copy embedded colormap to config categories** to bring across both the
    values and their original colours.


5. Edit a couple of the category labels to align to the World Cover class
   names (e.g. `10 → Tree cover`, `30 → Grassland`). See the
   [WorldCover class lookup](04-categories-wms.md#worldcover-class-lookup) for
   the full list of values, colours and names.
6. Save the layer card and preview. The COG is now rendered with the labels
   and colours you defined.


    The values are populated from a **sample** of pixels. It is possible for
    a small number of pixels to fall into classes that were not sampled.
    Cross-check against the source data if completeness matters.
