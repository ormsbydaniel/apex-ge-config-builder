---
title: 9-4. Defining a custom CRS
---

# 9-4. Defining a custom CRS

The Geospatial Explorer ships with a set of built-in CRS options [as noted in
9-2](02-key-concepts.md), but you are not limited to them. In this tutorial you
will add **EPSG:27700 — British National Grid** as a custom CRS, use it as the
display projection for the map, and add a Sentinel-2 dataset that is supplied
in OSGB so it lines up natively with the National Grid.

1. Start with either a new config, or add to your existing one from the
   earlier exercises.

2. Open the **Settings** tab and scroll to the **CRS** section. Under
    **Custom CRS**, select **+ Add CRS** and complete the dialog:

    - **Name:** `British National Grid`
    - **CRS Code:** `EPSG:27700`
    - **Proj4js Definition:**
      `+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +units=m +no_defs +type=crs`

    The new CRS appears as a pill under **Custom CRS** and, from now on, in the
    **Default Coordinate Reference System** dropdown under *Custom Projections*.

3. Set the **Default Coordinate Reference System** to **EPSG:27700 - British
   National Grid**.

4. Still in **Settings**, set the start location to the UK. In the
   **Navigation** section, choose **United Kingdom** from the **Quick
   location** list.

5. Open **Preview**. The map should now open on the UK in British National
   Grid rather than Web Mercator.

6. Go back to the **Layers** tab and add a new layer called
   **Sentinel 2 British National Grid**. Choose **+ Add dataset → Direct
   Connection → COG** and paste in this URL:

    `https://dap.ceda.ac.uk/neodc/sentinel_ard/data/sentinel_2/2026/09/21/S2A_20260921_latn518lone0007_T30UYC_ORB094_20260921161450_utm30n_osgb_vmsk_sharp_rad_srefdem_stdsref.tif`

7. Turn on **Display on load** for the layer and **Save**, then open
   **Preview** again. The Sentinel-2 scene should display over the UK in the
   British National Grid view.

!!! tip
    Proj4js definitions for almost any CRS can be copied from
    [https://epsg.io](https://epsg.io) — search for the EPSG code and copy the
    Proj4 string.

!!! info
    This dataset is supplied in OSGB (British National Grid), so it can be shown
    without reprojection when the display CRS is EPSG:27700. Data stored in other
    projections — such as the UTM grid used for most Sentinel-2 scenes — is
    reprojected on the fly, as you saw in 9-3.
