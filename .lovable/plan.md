

## Advanced Settings with OpenLayers Style Object

### Approach

Instead of a custom `bandSettings` property, the Advanced Settings will generate and persist a full OpenLayers `style` object on each COG `DataSourceItem`. The `style` property already exists on `DataSourceItem` as `any`, so no type/schema changes are needed.

### How it works

**State**: When entering advanced mode, initialize per-channel min/max from the existing `style.variables` (if present) or defaults (0/10000). The band numbers come from `selectedBands`.

**UI**: An "Advanced Settings >>>" button below Selected Bands, enabled when 3 bands are selected. Clicking it hides the band selection columns and shows:
- A "<<< Back to Band Selection" link
- A compact summary: R = Band X, G = Band Y, B = Band Z
- Per-channel min/max number inputs (6 fields total)

**Save logic**: `handleSave` builds the full OpenLayers style object from the selected bands + min/max values:
```json
{
  "variables": { "rBand": 1, "gBand": 2, "bBand": 3, "rMin": 0, "rMax": 10000, ... },
  "color": ["array", ["interpolate", ...], ..., ["case", ...]]
}
```
This is set as `style` on each COG data source item (alongside `convertToRGB` and `bands`).

### Files to modify

- **`src/components/layers/components/RgbCompositeEditorDialog.tsx`**
  - Add `showAdvanced` state, per-channel min/max state
  - Add helper `buildRgbStyle(bands, mins, maxes)` to generate the OpenLayers style object
  - Add "Advanced Settings >>>" button (disabled when < 3 bands selected)
  - Conditionally render advanced panel vs band selection
  - Update `handleSave` to include `style` on COG sources when advanced values are set
  - Initialize min/max from existing `style.variables` when dialog opens

No changes needed to `dataSource.ts` or `configSchema.ts` — `style` is already supported as `any`.

