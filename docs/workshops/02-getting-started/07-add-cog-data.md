---
title: 2-7. Add a COG data source
---
# 2-7. Add a COG data source

In this step we will attach a Cloud Optimized GeoTIFF (COG) to your
*Above Ground Biomass* layer card.

1. On your layer card, select the **Datasets** tab and choose **+ Add dataset**. Keep **Direct connection** and **COG** selected as the data format.
2. Paste the following into the **Data source URL** and select **Add source**:

    ```
    https://eoresults.esa.int/d/FCM-AGB-100m/2023/01/01/FCM-AGB-100m-2023/FCM_Europe_demo_2023_AGB.tif
    ```


3. On the *Datasets* tab, click the **(i)** info icon on the new data source row. Take a general look at the COG's metadata — whether the file is cloud optimized, the file size, overviews, and the image properties. Make a note of the **min** and **max** pixel values for the next step, then close the dialog.

    ![COG metadata dialog for the AGB GeoTIFF](../../assets/screenshots/workshops-getting-started-cog-metadata.png)



!!! success "You've added your first layer!"
    From here you can add more data, restyle it, and layer in more advanced
    controls.

See [COG](../../data-sources/cog.md) for the full COG source reference.
