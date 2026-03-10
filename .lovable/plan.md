

## Align Pencil Icons in Data Visualisation Section

**Problem**: Each pencil icon sits immediately after its label text, so they appear at different horizontal positions depending on label length ("Categories", "Colormaps", "RGB Composites", "Legend").

**Solution**: Add `flex-1` to each label `<span>` within the four sub-section headers. This makes the label expand to fill available space, pushing the pencil icon to the right edge — all four pencils will align vertically.

**Single file change**: `src/components/layers/components/LayerDataVisualisationSection.tsx`

Four edits — add `flex-1` to the `<span>` on lines 57, 93, 143, and 172.

```text
Before:  [Icon] [Label........] [Pencil]
                [Longer Label.........] [Pencil]

After:   [Icon] [Label................] [Pencil]
                [Longer Label.........] [Pencil]
                                         ↑ aligned
```

