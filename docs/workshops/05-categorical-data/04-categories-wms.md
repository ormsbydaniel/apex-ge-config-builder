---
title: 5-4. Categories for a WMS layer
---
# 5-4. Categories for a WMS layer

Now update the *World Cover* WMS layer you created in
[Add a WMS layer directly](../02-getting-started/09-wms-service.md).

Unlike a COG, a WMS or WMTS service cannot be interrogated for its pixel
values — there is no way to sample the underlying data, so the class numbers
are not available and, in fact, are not relevant here. What we still need are
the **colours** and the **labels**, so the Explorer can draw a meaningful
legend.

Because we already defined a full category set on the COG layer, we can simply
copy it across.

1. On the **Layers** tab, edit the *World Cover* layer card.
2. Go to **Data Visualisation → Categories → Edit**.
3. In the categories editor choose **Copy from layer** and select
    **Austria Land Cover** (the COG layer from
    [5-3. Categories for a COG](03-categories-cog.md)).

    ![Edit Categories dialog for the World Cover WMS layer showing populated categories](../../assets/screenshots/categories-wms-editor.png)

4. Save the layer card and preview. The legend in the Explorer now contains a
    row per class, using the colours and labels you copied.

    If in the last tutorial you only edited the class names that the COG
    populated, you will not have **Shrubland** or **Mangroves** here — neither
    class is present in Austria, so they were never sampled. If you imported
    the CSV, the full set will be there.

    An alternative for this WMS layer is therefore to import the categories
    directly from
    [`world-cover-classes.csv`](../../assets/world-cover-classes.csv), as
    described in [5-3 step 5](03-categories-cog.md).

See the full WorldCover class lookup in
[5-3. Categories for a COG](03-categories-cog.md#worldcover-class-lookup).
