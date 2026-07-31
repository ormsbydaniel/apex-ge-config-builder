---
title: 5-5. Manual timestamps on WMS / WMTS
---
# Manual timestamps on WMS / WMTS

Some WMS / WMTS services expose time as separate **layers** rather than via a
`TIME` parameter on a single layer. The World Cover WMS from Part 2 is an
example — there are separate `WORLDCOVER_2020_MAP` and `WORLDCOVER_2021_MAP`
layers.

1. Edit the *World Cover* layer card. Toggle **Temporal control** on with
   **Years** granularity.
2. Edit the existing World Cover dataset:
   - **Uncheck** the *Use TIME PARAM from service* toggle.
   - Explicitly set the timestamp to `2020-01-01`.
3. Add a second dataset for the 2021 layer and set its timestamp to
   `2021-01-01`. The URLs are:

    - **Service URL**:

        ```text
        https://services.terrascope.be/wms/v2
        ```

    - **Layer names**:

        ```text
        WORLDCOVER_2020_MAP
        ```

        ```text
        WORLDCOVER_2021_MAP
        ```

4. Save and preview. The temporal control now switches between the two years.

### Did you remember to export?

If not, now is a good moment.
