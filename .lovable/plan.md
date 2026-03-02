

## Design Decision: COG Source Selection for Pixel Values Charts

Currently `ChartSourceForm` has no access to the parent layer's data sources. To support pixelValues charts, we'd pass the layer's `data: DataSourceItem[]` array as a new prop.

### Proposed UI Behavior

**Single COG source**: No selector shown — that source is used automatically for band label detection and sample pixel fetch.

**Multiple COG sources**: Show a `Select` dropdown labeled "Sample Source" listing each COG by a derived label (filename from URL, or `"Source 1"`, `"Source 2"` etc.). The selected source determines:
- Which COG's bands populate the X-axis label editor
- Which COG is sampled for the preview pixel values

Only `format: 'cog'` entries from the data array would appear in the dropdown (non-COG sources like WMS aren't relevant for pixel sampling).

### Implementation

1. **`LayerFormHandler.tsx`** — Pass `currentLayer.data` (filtered to COG items) to `ChartSourceForm` as a new `cogSources` prop.

2. **`ChartSourceForm.tsx`** — Accept `cogSources?: DataSourceItem[]`. When pixelValues source type is selected:
   - If `cogSources.length === 1`: auto-select it, no dropdown
   - If `cogSources.length > 1`: render a `Select` with source labels derived from URLs
   - If `cogSources.length === 0`: show a warning that no COG sources are configured on this layer

3. The selected COG source feeds into the band label editor and sample pixel utility — no config storage needed since pixelValues charts read from whichever bands the runtime map click handler provides. The selector is purely for the editor preview.

This keeps the scope small — just one conditional `Select` component and a prop thread-through.

