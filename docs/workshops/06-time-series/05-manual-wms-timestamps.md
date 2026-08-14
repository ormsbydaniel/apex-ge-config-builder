---
title: 6-5. Manual timestamps on WMS / WMTS
---
# 6-5. Manual timestamps on WMS / WMTS

As well as COG datasets, WMS / WMTS services can be configured with manually
set timestamps so that the temporal control on a layer switches between
separate datasets.

This is useful when a service exposes time as **separate layers** rather than
via a single `TIME` parameter, or when you want to compose a time series from
hand-picked layers.

1. Create a new layer card called **NDVI time series**.
2. In the layer **Controls**, add **Temporal Control → Years**.
3. Select **+ Add dataset → From service → Terrascope MapProxy WMS** and add
   the **WORLDCOVER NDVI 2020** layer.
4. After the dataset is added, open its settings and explicitly set the
   timestamp to:

    ```
    2020-01-01
    ```

5. Add a second dataset to the same layer for **WORLDCOVER NDVI 2021** and set
   its timestamp to:

    ```
    2021-01-01
    ```

6. Save the datasets and click **Preview**. The layer should now display a
   **Years** temporal control; use it to step between the 2020 and 2021 NDVI
   layers.

### Did you remember to export?

If not, now is a good moment.
