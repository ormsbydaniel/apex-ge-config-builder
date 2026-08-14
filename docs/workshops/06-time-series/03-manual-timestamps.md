---
title: 6-3. Temporal control with manual timestamps
---
# 6-3. Temporal control with manual timestamps

Attach timestamps to your *Above Ground Biomass* layer (ABG) datasets by hand.

1. Edit the *AGB* layer card. Scroll down to the **Controls** section, toggle
   **Temporal control** on and set the dropdown to **Years**. Save and exit.
2. On the **Datasets** tab, **edit** the AGB dataset. A timestamp field is now
   available. Enter the date matching the data — a full date like `2023-01-01`
   is required, but with the granularity set to *Years* the GE will show it
   simply as `2023`. Save and return to the layer.
3. Add another dataset via **Direct connection → COG** and paste in this URL:

    ```text
    https://eoresults.esa.int/d/FCM-AGB-100m/2021/01/01/FCM-AGB-100m-2021/FCM_Europe_demo_2021_AGB.tif
    ```

    Set the timestamp to `2021-01-01` and save.
4. Optionally, open the layer's JSON editor and confirm that each dataset now
    has a `timestamp` field.
5. Preview and use the temporal control to step between years.
