

## Fix: Legend save writes to correct location (layerCard vs infoPanel)

### Problem
In `LayerDataVisualisationSection.tsx`, the legend is **read** from either `layerCard` or `infoPanel` (line 35), but the `onUpdateLegend` callback (lines 185-192) **always writes to `layerCard.legend`**, ignoring the layer's `contentLocation` setting.

### Fix — `src/components/layers/components/LayerDataVisualisationSection.tsx`

Update the `onUpdateLegend` callback (lines 185-192) to check `source.layout?.contentLocation` and write to the correct location:

- If `contentLocation === 'infoPanel'` → write to `infoPanel.legend`
- Otherwise → write to `layerCard.legend` (current behavior)

This mirrors the pattern already used in the Controls Editor Dialog (`ControlsEditorDialog.tsx` line 82).

```text
onUpdateLegend={(updatedLegend) => {
  const isInfoPanel = source.layout?.contentLocation === 'infoPanel';
  if (isInfoPanel) {
    onUpdateLayout({
      infoPanel: {
        ...source.layout?.infoPanel,
        legend: updatedLegend,
      },
    });
  } else {
    onUpdateLayout({
      layerCard: {
        ...source.layout?.layerCard,
        legend: updatedLegend,
      },
    });
  }
}}
```

Single file, ~10 lines changed.

