---
title: 9. Add a WMS layer directly
---
# Add a WMS layer directly

Add a WMS layer using the direct connection flow.

1. On the **Layers** tab, add a new **interface group** called `Land Cover`.
2. Inside it, add a **layer card** called `World Cover` with a suitable
   description and attribution.
3. On the card, select **+ Add dataset**.
4. Choose **Direct connection → WMS/WMTS service**.
5. Paste the following into the **Service URL**:

    ```text
    https://services.terrascope.be/wms/v2
    ```

6. Paste the following into the **Layer name**:

    ```text
    WORLDCOVER_2020_MAP
    ```

7. Save and preview. The World Cover WMS renders on the map with your chosen
   attribution and description in the info panel.



See [WMS / WMTS / WFS](../../data-sources/wms-wmts-wfs.md) for the full
reference.
