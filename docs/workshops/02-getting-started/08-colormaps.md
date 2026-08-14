---
title: 2-8. Style with a colormap
---
# 2-8. Style with a colormap

Now that your COG is attached, style it with a **colormap** so the pixel
values render as a colour ramp on the map.

1. Select the **pencil** edit icon at the top of your *Above Ground Biomass*
   layer card to return to edit mode.
2. Expand the **Data Visualisation** section (the eye icon) on the layer card.
3. Next to **Colormap**, select the **pencil** icon (or the **Add…**
   affordance if no colormap is set yet). The colormap editor opens.
4. Pick a colour ramp of your choice — for example *Viridis* for biomass.
5. Enter the **min** and **max** values you noted from the COG metadata in the
   [previous step](07-add-cog-data.md). Values outside this range are clamped.
6. **Save** the colormap, then **Save changes** on the layer card.
7. Go to **GE Preview**. The AGB data now renders with your colour ramp, and
   the legend is generated automatically from the colormap. Your map should
   look something like this:

![AGB layer styled with a colormap in GE Preview](../../assets/screenshots/workshops-getting-started-colormap-preview.png)

!!! tip "One styling tool at a time"
    Categories, Colormap, RGB Composite and Gradient are mutually exclusive for
    a raster layer — activating one clears the others.

See [Colormaps](../../layers/colormaps.md) for the full colormap reference.
