---
title: 5-3. Using STAC timestamps
---
# Using STAC timestamps

STAC items carry timestamps on the items themselves. When you pull assets from
a STAC browser the CB copies those timestamps onto the resulting datasets.

1. On the *AGB* layer card, select **+ Add dataset → From service → PRR**.
2. Find the AGB collection. Note that each item has a date stamp.
3. **Add all five AGB assets** to the layer.
4. Back on the layer card you should now see seven datasets — the two you
   added manually in the previous exercise plus the five from STAC. Delete
   the two manual ones since they are now duplicates.
5. Optionally inspect the JSON. Notice that the timestamps have been **copied
   into the config**, not linked. The GE does not re-fetch the STAC catalogue
   at runtime, so if the STAC catalogue owner corrects a timestamp later you
   would need to re-add the asset (or edit the timestamp by hand) to pick up
   the correction.
