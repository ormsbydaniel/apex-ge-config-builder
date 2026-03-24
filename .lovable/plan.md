

## Add JSON Editor to Vector Styling Dialog

### What it does
Replaces the placeholder content in the Vector Styling dialog with a Monaco JSON editor pre-loaded with a `style` array. On save, the style array is applied to every vector-format data source item (GeoJSON, FlatGeoBuf, WFS) in the layer's `data` array.

### Changes

**1. `src/components/layers/components/VectorStylingDialog.tsx` — Full rewrite**

- Add `onUpdateDataSources` prop (same pattern as `RgbCompositeEditorDialog`)
- On open: scan `source.data` for the first vector-format item that has a `style` property; use that as the initial value, otherwise default to `[]`
- Render a `MonacoJsonEditor` with the style JSON (formatted as the contents of the `"style"` array)
- Add Save and Cancel buttons in a `DialogFooter`
- On Save: parse the JSON, validate it's an array, then map over `source.data` — for every item where `isVectorFormat(item.format)` is true, set `item.style = parsedArray`. Call `onUpdateDataSources(updatedData)` and close
- Show a toast on parse errors

**2. `src/components/layers/components/LayerDataVisualisationSection.tsx` — Wire up new prop**

- Pass `onUpdateDataSources` to `VectorStylingDialog`
- Update the label to show style count instead of "(None)" when vector styles exist (e.g., "(3 rules)")

### Technical details
- Reuses `MonacoJsonEditor` from `src/components/config/components/MonacoJsonEditor.tsx`
- Reuses `isVectorFormat` from `src/utils/fieldDetection.ts` to identify which data items get the style applied
- Dialog size: `max-w-2xl` with editor height ~400px

### Files modified
1. `src/components/layers/components/VectorStylingDialog.tsx`
2. `src/components/layers/components/LayerDataVisualisationSection.tsx`

