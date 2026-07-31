---
title: 5-2. Temporal control with manual timestamps
---
# 5-2. Temporal control with manual timestamps

Attach timestamps to your *AGB* datasets by hand.

1. Edit the *AGB* layer card. Scroll down to the **Controls** section, toggle
   **Temporal control** on and set the dropdown to **Years**. Save and exit.
2. On the **Datasets** tab, **edit** the AGB dataset. A timestamp field is now
   available. Enter the date matching the data — a full date like `2023-01-01`
   is required, but with the granularity set to *Years* the GE will show it
   simply as `2023`. Save and return to the layer.
3. To add another year, click the **copy** icon on the AGB dataset row — this
   copies the URL of the current COG.
4. Add another dataset via **Direct connection → COG**, pasting the URL in and
   editing the path to point at a different year (assuming the data exists).
   Set its timestamp too. Save.
5. Optionally, open the layer's JSON editor and confirm that each dataset now
   has a `timestamp` field.
6. Preview and use the temporal control to step between years.
