---
title: 5-4. Using WMS / WMTS time parameters
---
# Using WMS / WMTS time parameters

Some WMS / WMTS services expose a `TIME` parameter directly. The CB can drive
that parameter from the temporal control on a layer.

1. Add a new layer card called `Soil moisture index`, and in **Controls** set
   the temporal granularity to **Days**.
2. Select **+ Add dataset → Direct connection → WMS/WMTS service** and add
   the following:

    - **Service URL**:

        ```text
        https://globalland.vito.be/wmts
        ```

    - **Layer name**:

        ```text
        clms_global_swi_1km_v1_daily
        ```

3. Note the **Use TIME PARAM from service** checkbox — it appears because the
   layer has temporal controls enabled. Leave it toggled **on**.
4. Save and exit. For interest, click the **(i)** info icon on the dataset —
   the WMS metadata shows this layer *does* expose a `TIME` parameter.
5. Preview the layer and step through the temporal control to see the
   available dates.
