---
title: 2-7. Add a COG data source
---
# 2-7. Add a COG data source

In this step we will attach a Cloud Optimized GeoTIFF (COG) to your
*Above Ground Biomass* layer card and give it a simple gradient legend.

1. On your layer card, select the **Datasets** tab and choose
   **+ Add dataset**.
2. Keep **Direct connection** and **COG** selected as the data format.
3. Paste the following into the **Data source URL** and select **Add source**:

   ```
   https://eoresults.esa.int/d/FCM-AGB-100m/2023/01/01/FCM-AGB-100m-2023/FCM_Europe_demo_2023_AGB.tif
   ```


4. The data source is now listed on the *Datasets* tab. Click the **(i)** info
   icon on the row to interrogate the COG's metadata.
5. Make a mental note of the **min** and **max** pixel values, then close the
   dialog.
6. Select the **pencil** edit icon at the top of the layer card to return to
   edit mode.
7. Scroll down and set **Legend type → Gradient**. Enter the **min** and
   **max** values you noted, with a colour at each end.
8. **Save changes**, then go to **GE Preview**. The AGB data now renders on the
   map, styled with your gradient.



!!! success "You've added your first layer!"
    From here you can add more data, restyle it, and layer in more advanced
    controls.

See [COG](../../data-sources/cog.md) for the full COG source reference.
