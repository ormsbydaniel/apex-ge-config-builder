

## Revised Plan: Remove `meta.rgbComposites`, detect `convertToRGB` from data sources

### Summary

Remove `meta.rgbComposites` entirely. RGB Composites in the Data Visualisation section will instead be driven by detecting `convertToRGB: true` on items in `source.data[]`. The pencil/delete buttons and modal remain — they will operate on `source.data` items rather than `meta`.

### Changes

**1. Types cleanup**

- `src/types/layer.ts` — Remove `RgbComposite` interface and `rgbComposites` from `DataSourceMeta`.
- `src/types/dataSource.ts` — Add explicit `convertToRGB?: boolean` to `DataSourceItem`.
- `src/schemas/configSchema.ts` — Remove `rgbComposites` from the meta Zod schema.
- `src/hooks/useValidatedConfig.ts` — Remove `rgbComposites` references.

**2. Delete `LayerRgbCompositesDisplay.tsx`** — No longer needed.

**3. Update `LayerDataVisualisationSection.tsx`**

- Accept new prop: `onUpdateDataSources: (updatedData: DataSourceItem[]) => void` (to bulk-update `source.data`).
- Detect RGB composites: `const convertToRgbCount = (source.data || []).filter(d => d.convertToRGB).length`.
- Display count: `RGB Composites (N)` or `(None)`.
- When active, show simple text: "Enabled on N data source(s)".
- **Delete button**: Iterates `source.data`, sets `convertToRGB` to `false` (or removes the property) on all items, calls `onUpdateDataSources`.
- **Pencil button**: Opens the "coming soon" modal (placeholder for future RGB composites editor that will manage `convertToRGB` and band settings across data sources).
- Participates in mutual exclusivity as before.

**4. Update `LayerCardContent.tsx`**

- Pass `onUpdateDataSources` handler that dispatches `UPDATE_SOURCE` with modified `source.data`.

**5. Clean up remaining references**

- `src/hooks/useLayerCardFormSubmission.ts` — Remove any `rgbComposites` handling.
- Any other files referencing `RgbComposite` or `meta.rgbComposites`.

