---
title: 2-5. Add recommended base maps
---
# 2-5. Add recommended base maps

1. On the **Layers** tab, scroll down to the **Base Layers** section and
   select **Add Recommended Base Layers**.

    ![Layers tab showing the Base Layers section](../../assets/screenshots/workshops-getting-started-layers-tab.png)

2. Look at the base map cards that appear — attribution and layer metadata are
   populated automatically.
3. Go to the **GE Preview** tab. You will now see a base map switcher in the
   Explorer.

    ![Base map switcher showing thumbnails of each available base map](../../assets/screenshots/workshops-getting-started-basemap-switcher.png)

    Note that the attribution statement at the foot of the map updates as you
    switch base maps, so the correct credits are always shown.

    ![Map attribution statement updated for the selected base map](../../assets/screenshots/workshops-getting-started-basemap-attribution.png)

4. OPTIONAL: Return to the **Layers** tab and expand one of the base map cards in
   the **Base Layers** section. Drill into the card to see how each base map is
   defined — its service URL, thumbnail, and the attribution text that the
   Explorer displays.






!!! tip "Where do the recommended base maps come from?"
    The recommended base maps are loaded at runtime from the
    [ESA-APEx configs manifest](https://github.com/ESA-APEx/apex_geospatial_explorer_configs).
    New base maps added to the manifest become available in the CB without a
    redeploy. See [Base layers](../../layers/base-layers.md) for details.
