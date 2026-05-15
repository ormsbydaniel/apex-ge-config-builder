---
title: Field values
status: draft
---
# Field values

The **Field Values** chart source builds inline pie charts from selected properties of a GeoJSON or FlatGeoBuf vector dataset on the layer. There is no external CSV; the values are read from the feature itself when the user clicks it.

## When to use

- A vector dataset where each feature carries multiple numeric breakdown columns (e.g. land-cover percentages, voting shares, sector mix per polygon).
- You want a pie chart per feature in the info panel without serving a separate CSV.

## Configure

1. The layer must have a GeoJSON or FlatGeoBuf data source on the **Datasets** tab.
2. In the layer's **Charts** tab, click **Add Chart** and choose **Field Values**.
3. The **Field Values selector** dialog opens, listing every property detected on the dataset. Tick the properties to include as pie slices.
4. The selected names are stored in `charts[].sources[0].fields` with `type: "inline"`.

The runtime reads each selected property from the clicked feature and builds the pie at view time, using the trace styling from the visual editor.

## Notes

- Property auto-detection uses the FlatGeoBuf header where available, or samples the first feature for GeoJSON.
- Non-numeric properties are filtered out of the picker.

## Related

- [GeoJSON / FlatGeoBuf data sources](../data-sources/geojson-flatgeobuf.md)
- [Vector fields](../layers/vector-fields.md) — controlling info-panel display of the same properties.
