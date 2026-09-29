---
title: 9-3. Using an alternative projection
---

# 9-3. Using an alternative projection

The Geospatial Explorer can render maps in a variety of Coordinate Reference
Systems (CRS). In this tutorial you will switch the default projection to a
polar view centred on the North Pole.

1. Using your own config from earlier exercises open the **Settings** tab. In the **Navigation** section, change the **Quick location** to **Custom (Manual Entry)** and enter in the following to set the location to the North Pole:
    - **Latitude:** `90`
    - **Longitude:** `0`
    - **Zoom level:** `4`

2. In the **CRS** section, set the **Default Coordinate Reference System** to
   **EPSG:3413** — _WGS 84 / NSIDC Sea Ice Polar Stereographic North_.

3. Switch the basemap to **Blue Marble** or **Stadia Satellite** to see the polar view clearly. To do this:

    - Go to the **Layers** tab and open the **Base Maps** section.
    - If you do not already have them, add the **Blue Marble** and **Stadia Satellite** background maps from the recommended base maps list.
    - Select the **Edit** button on **Blue Marble** or **Stadia Satellite** and
      turn on its **Display on load** toggle.
    - **Save** the base map changes.

4. Open **Preview**. The map should now open looking down on the North Pole.

5. If you are using a config from the core tutorials, toggle on the **Above Ground Biomass** layer. Note how the data reprojects on the fly in the polar projection.

!!! tip
    Try returning to **Settings → Navigation** later and switching the CRS back
    to EPSG:3857 or EPSG:4326 to compare how the same start location and layer
    look in a different projection.

    If you want to continue with other tutorials, you may find it easier to
    switch back to the default **EPSG:3857** and a more familiar start location
    after exploring the polar view.

!!! info
    The Geospatial Explorer ships with the default projections shown in the
    **Default Coordinate Reference System** dropdown. If you need a projection
    that is not listed, you can add it under **Custom Projections** by entering
    the appropriate Proj4JS string.

    Data is reprojected on the fly from its source projection to the display
    projection, so custom projections can also be useful for supporting specific
    datasets even when the display CRS is one of the built-in options.
