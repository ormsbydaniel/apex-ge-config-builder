---
title: 3-5. Add data from the "PRR"
---

# 3-5. Add data from the "PRR"

The _Project Results Repository ("PRR")_ is a STAC catalogue of ESA project
results. The full catalogue is visible on the APEX Project Website [here](https://browser.apex.esa.int/external/eoresults.esa.int/stac?.language=en).
However, once it has been added as a service in the GE Configuration Builder (as you did in 3-4), we can drill into its details directly from the user interface of the CB.

1. On the **Layers** tab, create a new layer card called `Below Ground Biomass` in your `Forest Carbon` interface group. A name for the layer is all you need at this stage, but if you want you can fill in a description and attribution similar to what you did on the `Above Ground Biomass'.
2. On the card, select **+ Add dataset → From service**, then select **ESA Project Results Repository**. The STAC browser opens, showing the collections in the PRR.
3. Spend a moment browsing the PRR to see how collections, items and assets are structured.
4. Find and attach a Below Ground Biomass COG:

    - **Search** for `below` and find the _FCM 100 m Europeran-wide Below Ground Biomass_ collection.
    - Select **Browse items**, select an item and choose **View Assets**. Although some collections might have multiple assets for an item, that is not the case here.
    - Choose **Select**. The _Add Data Source_ screen is populated with your selected COG; click **Add Source** to attach it to the layer.

5. Finish styling the layer, just as you did in tutorial 2-8. To recap, you need to:

    - click on the "(i)" icon on the dataset row to inspect its metadata
    - note the min/max values of the cog
    - select the pencil icon next to colormap to call up the appropriate UI, then choose an appropriate colormap as you see fit

!!! info About the Project Results Repository

    The PRR contains outputs from a range of ESA funded projects.  Whilst many of these may be compatible with the *APEX Geospatial Explorer*, such as those with assets in a compatible format (e.g. COGS, GeoJSON, FlatGeobuff etc), it somewhat depends on the intended use case that the relevant project team have.

    For example some products might have been provided for the purpose of analysis rather than display. For more complex datasets, such as hyperspectral data, specific settings, such as the interleaving of bands may be optimised for those analysis purposes rather than visualisation.   So, whilst the PRR is a great resource to explore outputs from ESA products, be mindful that their presence in the PRR is not necessarily a guarantee that they will work with the GE.

See [STAC browser](../../data-sources/stac-browser.md) for the full reference,
including asset filtering and bulk selection.
