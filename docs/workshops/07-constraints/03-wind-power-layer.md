---
title: 7-3. Add the wind power layer
---
# 7-3. Add the wind power layer

Before adding constraints we need something to constrain. In this step we build
a single COG layer showing wind power density at 100 m over Austria.

1. In the **Layers** tab select **Add layer** and name it
   `Austria Wind Power Density at 100m`.

2. Add a **COG** data source with this URL:

    ```
    https://eox-gtif-public.s3.eu-central-1.amazonaws.com/DHI/PowerDensity_100m_Austria_WGS84_COG_clipped_3857_fix.tif
    ```

3. In the layer **Metadata**, set:

    - **Description** — "The wind power density (w m 2) is a measure of the
      available wind resource at 100 metres height. Higher wind power density
      indicates greater wind power potential. Constraints allow the data to be
      filtered by multiple criteria."
    - **Units** — `w / m 2`
    - **Attribution** — text `ESA GTIF`, URL
      [https://gtif.esa.int/](https://gtif.esa.int/){:target="_blank"}

4. Open **Data Visualisation → Colormaps → Edit** and add a colormap:

    | Setting | Value |
    | --- | --- |
    | Name | `jet` |
    | Min | 0 |
    | Max | 2000 |
    | Steps | 50 |
    | Reverse | off |

5. In **Layout**, set the interface group to `Energy` and the sub-interface
   group to `Austria Green Transition`. Set the content location to
   **Info panel** and the legend type to **Swatch**.

6. In the layer card **Controls**, enable:

    - **Opacity slider**
    - **Zoom to centre**
    - **Constraint slider**

    Leave **Temporal controls** and **Blend controls** off.

    !!! warning "Constraint slider"
        Without the **Constraint slider** control the constraints you add in
        the following steps will be saved to the configuration but will never
        appear in the viewer.

7. Open the **Preview** and turn the layer on. You should see a jet colour ramp
   over Austria with a swatch legend, and no constraint controls yet.

### Did you remember to export?
