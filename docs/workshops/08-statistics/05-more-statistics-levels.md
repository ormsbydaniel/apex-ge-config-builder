---
title: 8-5. Add the remaining NUTS levels
---

# 8-5. Add the remaining NUTS levels

One level of boundaries works, but the experience is much better when the
detail follows the zoom - country -> region -> sub-region etc. Add the three finer NUTS levels the same way.
Each new source takes the **next level number** automatically, so adding them
in this order gives you levels `0`, `1`, `2` and `3`.

1. Add a statistics source for **NUTS 1** (major regions):

   ```
   https://esa-apex.s3.eu-west-1.amazonaws.com/APEX-example-data/HI-RES-NUTS/stats.esa_worldcover_2021.nuts_2024.epsg4326.level01.fgb
   ```

2. Add a statistics source for **NUTS 2** (basic regions):

   ```
   https://esa-apex.s3.eu-west-1.amazonaws.com/APEX-example-data/HI-RES-NUTS/stats.esa_worldcover_2021.nuts_2024.epsg4326.level02.fgb
   ```

3. Add a statistics source for **NUTS 3** (small regions):

   ```
   https://esa-apex.s3.eu-west-1.amazonaws.com/APEX-example-data/HI-RES-NUTS/stats.esa_worldcover_2021.nuts_2024.epsg4326.level03.fgb
   ```

4. View the result. Open the **Preview**, select the **Statistics** tab in the
   panel and click a **country** on the map. Now click on a **region** — as
   the zoom increases the Explorer switches to the finer NUTS levels,at each level presented a new set of polygons at the tier below. Use the **breadcrumbs** on the statistics panel to navigate back up and down through the nhierarcy.

!!! tip "Fixing a level"
If you add the files out of order, or delete one and re-add it, the levels
can end up wrong. Edit the statistics source and set the **level** by hand,
or correct the `level` values in the per-layer **{JSON}** editor. Levels
should run from `0` upwards with no gaps and no duplicates.

### Did you remember to export?
