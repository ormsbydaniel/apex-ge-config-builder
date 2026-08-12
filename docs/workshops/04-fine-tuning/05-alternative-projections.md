---
title: 4-5. Alternative projections
---
# 4-5. Alternative projections

The Geospatial Explorer can render maps in a variety of Coordinate Reference
Systems (CRS). In this tutorial you will switch the default projection to a
polar view centred on the North Pole.

1. Open the **Settings** tab in the configuration builder.

2. Select **Navigation** from the settings list.

3. In the **Default start location** section, switch to **Custom (Manual Entry)**
   and set:
   - **Latitude:** `90`
   - **Longitude:** `0`

4. In the **CRS** section, set the **Default Coordinate Reference System** to
   **EPSG:3413** — *WGS 84 / NSIDC Sea Ice Polar Stereographic North*.

5. **Save** the settings.

6. Open **GE Preview**. The map should now open looking down on the North Pole.

7. If you added the recommended background maps, switch the basemap to
   **Blue Marble** or **Stadia Satellite** to see the polar view clearly:

    1. Go to the **Layers** tab and open the **Base Maps** section.
    2. Select the **Edit** button on the OpenStreetMap base map and turn off its
       **Display on load** toggle.
    3. Select the **Edit** button on **Blue Marble** or **Stadia Satellite** and
       turn on its **Display on load** toggle.
    4. **Save** the base map changes.

8. Open **GE Preview** again and turn on the **Above Ground Biomass** layer to
   see how the data reprojects on the fly in the polar projection.

!!! tip
    Try returning to **Settings → Navigation** later and switching the CRS back
    to EPSG:3857 or EPSG:4326 to compare how the same start location and layer
    look in a different projection.
