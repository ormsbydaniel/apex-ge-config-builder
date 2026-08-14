---
title: 8-6. Understanding the statistics files
---
# 8-6. Understanding the statistics files

The statistics you just saw are not calculated by the Explorer. They are read
straight from the attributes of the NUTS features. To see that for yourself,
load one of the same files as ordinary vector data.

1. Add a new layer and name it `Temp`.

2. On the `Temp` layer card, open **Data Sources** and stay on the **Data**
   tab — *not* Statistics this time.

3. Click **Add source**, choose **Direct** connection and the format
   **FlatGeoBuf**.

4. Use the NUTS level 0 file again:

    ```
    https://esa-apex.s3.eu-west-1.amazonaws.com/APEX-example-data/HI-RES-NUTS/stats.esa_worldcover_2021.nuts_2024.epsg4326.level00.fgb
    ```

5. **Save** the source and open the **Preview**, turning the `Temp` layer on.
   The country boundaries are drawn as a normal vector layer.

6. Select the **Data Values** tab in the panel and click on a country. The
   feature's properties are listed in full.

7. Look at what is there. Alongside the descriptive fields — country and region
   names, NUTS codes, level — are the pre-computed class areas for each World
   Cover class. These attributes are exactly what the **Statistics** tab reads
   and charts under the bonnet; the only difference is that a statistics source
   is interpreted as a summary to plot, rather than as a layer to draw.

8. Delete the `Temp` layer when you are done — it was only there to look inside
   the file.

!!! tip "Building your own statistics files"
    Any FlatGeoBuf or GeoJSON of zones will work as a statistics source, as long
    as each feature carries the pre-computed values as properties and the file
    is published in a CRS the Explorer can reproject.

### Did you remember to export?
