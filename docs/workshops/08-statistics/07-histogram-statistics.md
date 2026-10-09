---
title: 8-7. Histogram statistics
---

# 8-7. Histogram statistics

In exercises 8-4 and 8-5, we added in statistics that had been created for categorical data. However the same structure of statistics file can also be used to present histograms. In this exercise, we also add statistics files in bulk.

1.  Navigate to the `Above Ground Biomass` layer that you created in exercise 2. Select **+Add statistics** from the statistics tab.

- This time, select the **From service** option and pick the **Sparkgeo ESA Apex S3 bucket** option.
- Navigate to **APEX Example data -> NUTS**
- Type **2021_AGB** into the search box
- Click **+Add all**

The configuration builder is clever enough to parse the file names for _level01, level02_ etc, and set the appropriate statistics layers.

2. Now go to **Preview**. From the statistics panel you can now navigate through the histogram charts.

3. _Optional_: Add the level 00 statistics a data source to a _Temp 2_ layer, as you did in the last exercise and inspect its data values.

<!-- Content to be written -->

### Did you remember to export?
