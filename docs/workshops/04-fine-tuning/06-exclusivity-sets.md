---
title: 4-6. Mutually exclusive layers
---
# 4-6. Mutually exclusive layers

For data like land cover, it only makes sense to display one layer at a time.
Overlapping land cover maps hide each other and make the map hard to read.
You can prevent this by adding the layers to an **exclusivity set**: when a
user switches on one layer in the set, the others are switched off.

1. On the **Layers** tab, scroll to the bottom of the page and find the
   **Exclusivity Sets** section. Enter `landcover` as the set name and select
   the **+** button to add it.

2. Scroll back to the **Land Cover** group. On the first World Cover layer,
   select the **edit** (pen) icon from the bank of icons at the top right of
   the layer card.

3. Scroll to the bottom of the layer editing page and, in the
   **Exclusivity Sets** section, tick the checkbox for **landcover**.

4. Save the layer, then repeat steps 2 and 3 for each of the other World
   Cover layers.

5. **Export** your configuration to save the exclusivity set.

!!! tip
    Use **Preview** to check the result: switching on one World Cover layer
    should switch off any other layer in the **landcover** set.
