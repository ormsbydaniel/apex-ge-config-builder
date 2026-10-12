---
title: 9-5. Styling a water index
---

# 9-5. Styling a water index

In this exercise we will copy one of the Bristol Sentinel 2 layers you have already styled and turn it into a **water index** layer, using the **Normalised Difference Water Index (NDWI)**.

!!! info "What is NDWI?"
NDWI compares the **green** and **near-infrared (NIR)** bands using the formula `(Green − NIR) / (Green + NIR)`. Water reflects green light but absorbs near-infrared strongly, so open water gives positive values, while vegetation and bare ground give negative values.

1. On the **top row** of the _Bristol Sentinel 2 natural colour_ layer card, select the **duplicate layer** icon (two overlapping blue squares).

2. Rename the **Bristol Sentinel 2 natural colour (copy)** layer to **Bristol Sentinel 2 NDWI**. If you created the **bristol-s2** exclusivity set in 9-4, the copy will already belong to it.

3. On the new layer card, click the **red trash can** icon next to the multi-band visualisation to clear the natural colour settings, then click the **pencil** icon to open the visualisation popup.

4. This time, select the **Indices** tab, then choose **Water (NDWI)**. Note how the _green_ and _NIR_ bands have been selected for you, and that a blue-to-red colour palette has been applied.

   !!! info "Check the bands"
   The band choices are worked out from the band descriptions in the COG. If a band looks wrong, use the **( i )** metadata icon on the dataset row from 9-3 to check which band is which, and change it in the popup.

5. Save the visualisation, then go to **Preview**. Switch on the NDWI layer and zoom in on the **River Severn**, the **Bristol Channel** and any reservoirs such as **Chew Valley Lake**. Water should stand out in blue, with land in red and white.

6. Return to the layer card and **edit the visualisation** again. Experiment with the visual range and customise settings options and preview your results.

   !!! info "Snow and shadows"
   Remember this scene is from January. Snow, cloud shadow and dark urban surfaces can sometimes give positive NDWI values too, so not everything that shows blue is water. The **Modified water (MNDWI)** index, which uses a short-wave infrared band instead of NIR, is better at separating water from built-up areas — we will look at it in 9-6.

### Did you remember to export?
