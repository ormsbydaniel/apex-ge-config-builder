---
title: 6-4. Using STAC timestamps
---
# 6-4. Using STAC timestamps

STAC items carry timestamps on the items themselves. When you pull assets from
a STAC browser the CB copies those timestamps onto the resulting datasets.

1. Return to your *Below Ground Biomass* layer (BGB). If you do not have one,
   create a new layer with this name first.
2. On the **Datasets** tab, **delete** the existing COG so the layer starts
   empty.
3. Go to the **Controls** section and add **Temporal Control → Years**. This
   must be configured before adding the datasets, otherwise the timestamps
   from the STAC items will not be available in the layer.
4. Select **+ Add dataset → From service → PRR** and find the BGB collection.
   Note that each item carries its own date stamp.
5. **Add all the BGB assets** to the layer. Back on the layer card each dataset
   should now show the timestamp taken from its STAC item.
6. Optionally inspect the JSON. Notice that the timestamps have been **copied
   into the config**, not linked. The GE does not re-fetch the STAC catalogue
   at runtime, so if the STAC catalogue owner corrects a timestamp later you
   would need to re-add the asset (or edit the timestamp by hand) to pick up
   the correction.
