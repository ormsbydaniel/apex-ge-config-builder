# Add delete (trash) icon to Vector Styling on the layer card

## Why it's missing

No deliberate reason — it was an oversight. The other four Data Visualisation options (Categories, Colormaps, RGB Composites, Gradient) each have a trash icon that clears their settings, but the Vector Styling row (added later) only got the pencil edit button.

## What to build

Add a trash icon to the Vector Styling row in `LayerDataVisualisationSection.tsx`, matching the existing pattern:

- Shown only when at least one vector data item has a non-empty `style` array (same condition the `VectorStyleSummary` uses).
- Clicking it clears the `style` array from **every** vector-format data item in the layer (GeoJSON, FlatGeoBuf, WFS), leaving other properties untouched — same approach as `handleDeleteRgbComposites`, which strips `convertToRGB` from each item.
- Same styling as the other trash buttons: ghost icon button, `h-4 w-4`, destructive colour, `Trash2` at `h-2.5 w-2.5`.
- Add a tooltip "Clear vector styling" for clarity (the existing ones have none — keep consistent and skip the tooltip, or add to all; default: skip to match).

## Technical details

- File: `src/components/layers/components/LayerDataVisualisationSection.tsx` (Vector Styling sub-section, ~line 302).
- Implementation: a `handleDeleteVectorStyling` handler that maps `source.data`, and for items where `isVectorFormat(item.format)` deletes the `style` key, then calls `onUpdateDataSources(updatedData)` — mirroring `handleDeleteRgbComposites` (lines 97–106).
- No config schema changes; clearing `style` just returns the layer to default rendering.
- Verification: run the unit test suite; user does visual testing in the preview (add styling to a vector layer, confirm the trash icon appears, clear it, confirm the summary returns to "None" and the style key is gone from the exported JSON).
