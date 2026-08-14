---
title: 8-6. Panel and controls
---
# 8-6. Panel and controls

Statistics are read in the side panel, so it is worth checking the layer's
layout settings before previewing.

1. Set the layer **content location** to **Info panel**. This is where the
   **Statistics** tab appears alongside the layer description.

2. Make the layer card **toggleable**, so users can switch the land cover
   raster on and off while keeping the panel open.

3. In **Controls**, enable:

    - **Opacity slider**
    - **Temporal controls** — the WMS advertises a time dimension and the
      timeframe is set to `Years`
    - **Blend controls**

    Leave **Zoom to centre** and **Constraint slider** off.

4. Add the layer to an **exclusivity set** called `worldcover`. Any other layer
   in that set is switched off when this one is switched on, which keeps land
   cover comparisons unambiguous.

5. Confirm the **legend type** is **Swatch**, so the class colours in the legend
   match the class breakdown shown in the statistics.

### Did you remember to export?
