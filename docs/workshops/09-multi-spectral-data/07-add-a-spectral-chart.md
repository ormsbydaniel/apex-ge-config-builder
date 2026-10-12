---
title: 9-7. Add a spectral chart
---

# 9-7. Add a spectral chart

So far you have looked at the Bristol scene as pictures: composites and indices. A **spectral chart** lets you look at the numbers behind those pictures. You will add a **Pixel Values** chart to the Bristol natural colour layer. In the Preview, clicking any point on the map shows the **spectral signature** of that pixel: its value in every band of the image.

!!! info "Why spectral signatures are useful"
Different surfaces reflect light differently at different wavelengths. Healthy vegetation reflects little red light but a lot of near infrared (NIR). Water absorbs almost all NIR and SWIR light. Bare soil and buildings tend to get brighter steadily from visible to SWIR. Comparing the signatures of a few points shows _why_ a pixel looks the way it does in a composite or an index. You may even want to choose different bands as a result.

## Steps

1. Open the **Bristol Sentinel 2** natural colour layer card you styled in 9-3.
2. Open the layer's **Charts** tab and click **+ Add Chart**.
3. Choose **Pixel Values** as the chart source. This option is only available when the layer has a COG dataset.
4. The X axis fills in automatically with one entry per band. If the file has no band descriptions, the entries are named **Band 1**, **Band 2**, and so on.
5. Save the chart settings, then **Preview**. Click on the **Charts** tab then on some pixels on the image to see the spectral chart.

## Optional: Customise the chart

6. Give the chart a **title**, e.g. _Bristol spectral signature_, and optionally a subtitle, e.g. _Sentinel 2 surface reflectance_.
7. Replace the generic band labels with meaningful names. For a typical Sentinel 2 band order these are noted in the table below. Note the first band (B02) would be band 1 in the COG and so on.

   | Band | Suggested label | Wavelength (approx.) |
   | ---- | --------------- | -------------------- |
   | B02  | Blue            | 490 nm               |
   | B03  | Green           | 560 nm               |
   | B04  | Red             | 665 nm               |
   | B05  | Red edge 1      | 705 nm               |
   | B06  | Red edge 2      | 740 nm               |
   | B07  | Red edge 3      | 783 nm               |
   | B08  | NIR             | 842 nm               |
   | B8A  | NIR narrow      | 865 nm               |
   | B11  | SWIR 1          | 1610 nm              |
   | B12  | SWIR 2          | 2190 nm              |

   !!! warning "Check the band order"
   Use the **(i)** metadata button on the dataset to confirm which bands your file contains, and in which order, before typing labels. If the labels are in the wrong order, the chart will be misleading.

8. Set the axis titles under **Chart configuration**, e.g. _Band_ for the X axis and _Reflectance_ for the Y axis.
9. Optionally, adjust the trace styling: choose **lines+markers** mode, a line colour and width.
10. **Save** the chart, then **Save** the layer card.

## Try it in the Preview

11. Open **Preview**, switch on the Bristol natural colour layer and open its chart.
12. Click on some contrasting places, for example:
    - water in the **Floating Harbour** or the **Severn Estuary**
    - woodland such as **Leigh Woods**
    - the city centre or **Avonmouth** docks
13. Compare the traces. Look for the sharp rise from Red to NIR over vegetation, low values across all bands over water, and the gradual rise towards SWIR over built-up areas.

!!! tip "Link back to your indices"
The indices in 9-5 and 9-6 are built from these differences. NDVI compares NIR and Red, and NDWI compares Green and NIR. Seeing the signatures shows why the indices separate vegetation, water and built-up land.

### Did you remember to export?

Export your configuration now so you don't lose your work.
