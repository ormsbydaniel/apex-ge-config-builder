---
title: 8-3. Add the World Cover layer
---
# 8-3. Add the World Cover layer

Before adding statistics we need a layer to attach them to. In this step we
build the ESA World Cover 2021 layer from the Terrascope MapProxy WMS service.

1. In the **Layers** tab, add an **Interface Group** called `Land Cover` with a
   **sub-group** called `World Cover`, then **Add layer** inside it and name the
   layer `World Cover 2021 with NUTS statistics`.

2. Add a **WMS** data source with this URL:

    ```
    https://mapproxy.terrascope.be/mapproxy/service
    ```

    and this layer name:

    ```
    esa-worldcover-map-10m-2021-v2_map
    ```

    The builder reads *GetCapabilities* when you save, sets the service
    **version** to `1.3.0`, and enables **Use time parameter** because this
    layer advertises a time dimension. Set the **timeframe** to `Years`.

3. Give the layer a **description** — copy in the following text:

    ```
    A 10 meter resolution global land cover product for the year 2021, developed and validated in near-real time based on Sentinel-1 and Sentinel-2 data.  Data is provided with statistics for NUTS (Nomenclature of territorial units for statistics) boundaries.  Select the "statistics" tab and click on a feature to view.
    ```

    The last sentence matters: statistics are only visible once the user opens
    the **Statistics** tab, so it is worth telling them.

4. Set the **attribution** to text `World Cover Project` with URL
   [https://esa-worldcover.org/](https://esa-worldcover.org/){:target="_blank"}.

5. Add the World Cover **categories**. If you completed
   [5. Categorical data](../05-categorical-data/index.md), open
   **Data Visualisation → Categories → Edit → Copy from layer** and copy them
   from your existing World Cover layer. Otherwise import them from the
   [World Cover class CSV](../../assets/world-cover-classes.csv), or type them
   in:

    | Value | Label | Colour |
    | --- | --- | --- |
    | 10 | Tree cover | `#006400` |
    | 20 | Shrubland | `#ffbb22` |
    | 30 | Grassland | `#ffff4c` |
    | 40 | Cropland | `#f096ff` |
    | 50 | Built-up | `#ff0000` |
    | 60 | Bare | `#b4b4b4` |
    | 70 | Snow and ice | `#f0f0f0` |
    | 80 | Permanent water bodies | `#0064c8` |
    | 90 | Herbaceous wetland | `#0096a0` |
    | 95 | Mangroves | `#00cf75` |
    | 100 | Moss and lichen | `#fae6a0` |

    Set the **legend type** to **Swatch**.

    !!! tip "Categories drive the statistics display"
        The statistics files store an area per class value. Without the
        category list the Explorer can only show raw numbers; with it, each
        entry gets its label and colour.

6. **Export** and check the layer renders in the **Preview** before moving on.

### Did you remember to export?
