---
title: 2-9. Add a WMS data source
---
# 2-9. Add a WMS data source

Add a WMS layer using the direct connection flow.

1. On the **Layers** tab, add a new **interface group** called `Land Cover`.
2. Inside it, add a **layer card** called `World Cover` with a suitable
   description (e.g. "Classification of land cover from Sentinel 2 data") and
   attribution ("ESA World Cover", <https://esa-worldcover.org/en>).
3. On the card, select **+ Add dataset**.
4. Choose **Direct connection → WMS/WMTS service**.
5. Paste the following into the **Service URL**:

    ```text
    https://mapproxy.terrascope.be/mapproxy/service
    ```

6. Paste the following into the **Layer name**:

    ```text
    esa-worldcover-map-10m-2021-v2_map
    ```

7. Save and preview. The World Cover WMS renders on the map with your chosen
   attribution and description in the info panel.



See [WMS / WMTS / WFS](../../data-sources/wms-wmts-wfs.md) for the full
reference.
