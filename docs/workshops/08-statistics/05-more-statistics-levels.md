---
title: 8-5. Add the remaining NUTS levels
---
# 8-5. Add the remaining NUTS levels

One level of boundaries works, but the experience is much better when the
detail follows the zoom. Add the three finer NUTS levels the same way.

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

Each new source takes the **next level number** automatically, so adding them
in this order gives you levels `0`, `1`, `2` and `3`.

!!! tip "Fixing a level"
    If you add the files out of order, or delete one and re-add it, the levels
    can end up wrong. Edit the statistics source and set the **level** by hand,
    or correct the `level` values in the per-layer **{JSON}** editor. Levels
    should run from `0` upwards with no gaps and no duplicates.

### Did you remember to export?
