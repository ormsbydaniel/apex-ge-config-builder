---
title: 8-3. Reuse the World Cover layer
---

# 8-3. Reuse the World Cover layer

We do not need a new layer for this tutorial. We will use the World Cover 2021 WMS layer
built in [2-9. Add a WMS data source](../02-getting-started/09-wms-service.md)
as the starting point for this exercise.

1. In the **Layers** tab, find the `World Cover 2021` layer in the `Land Cover`
    interface group

    - **edit its name** to:

        ```
        World Cover 2021 with statistics
        ```

    - update the layer **description** with the folliwng user guidance:

        ```

        A 10 meter resolution global land cover product for the year 2021, developed and validated in near-real time based on Sentinel-1 and Sentinel-2 data.  Data is provided with statistics for NUTS (Nomenclature of territorial units for statistics) boundaries.  Select the "statistics" tab and click on a feature to view.
        ```

2. Confirm the layer has its World Cover **categories** defined. If you
    completed [5. Categorical data](../05-categorical-data/index.md) they are
    already there. If not, add them now via **Data Visualisation → Categories →
    Edit**, either with **Copy from layer** or by importing the
    [World Cover class CSV](../../assets/world-cover-classes.csv), and set the
    **legend type** to **Swatch**.

    !!! tip "Categories drive the statistics display"
        The statistics files store an area per class value. Without the
        category list the Explorer can only show raw numbers; with it, each
        entry gets its label and colour.

### Did you remember to export?
