---
title: 25. Create a categorical constraint
---
# Create a categorical constraint

Add a World Cover constraint to your *AGB* layer so users can filter the
biomass values by land cover class.

1. Edit the *AGB* layer card and open the **Constraints** tab.
2. Add the following World Cover TIF, which covers the same area as the AGB
   data:

    ```text
    https://esa-apex.s3.eu-west-1.amazonaws.com/APEX-example-data/constraints/FCM_Europe_demo_2023_AGB-esa_worldcover_2021.tif
    ```

3. Select **Populate categories from COG**.
4. Edit the category labels to match the World Cover class names (Tree cover,
   Shrubland, Grassland, …).
5. Save the layer card and preview. The AGB layer now has a set of land-cover
   checkboxes in its constraint panel.
