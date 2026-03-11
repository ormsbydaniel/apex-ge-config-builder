

## Legend and Units Dialog Enhancement

### What changes

1. **`LegendEditorDialog.tsx`** — Rename title to "Legend and Units", add `units` prop and `onUpdateUnits` callback, add a text input for units below the legend settings.

2. **`LayerLegendSection.tsx`** — Pass `source.meta?.units` and an `onUpdateMeta` handler to the dialog so units can be read/written via `meta.units`.

3. **`LayerCardContent.tsx`** — Pass `handleUpdateMeta` to `LayerLegendSection`.

### Detail

**LegendEditorDialog.tsx:**
- New props: `units?: string`, `onUpdateUnits?: (units: string) => void`
- New state: `unitsValue` initialized from `units` prop, reset on open
- Add a "Units" text input field after the legend type section (always visible)
- On save, call `onUpdateUnits(unitsValue)` alongside the existing legend save
- Title: "Legend and Units", description updated accordingly

**LayerLegendSection.tsx:**
- Add `onUpdateMeta` prop: `(updates: Record<string, any>) => void`
- Pass `units={source.meta?.units}` and `onUpdateUnits={(u) => onUpdateMeta({ units: u || undefined })}` to `LegendEditorDialog`

**LayerCardContent.tsx:**
- Change `<LayerLegendSection source={source} onUpdateLayout={handleUpdateLayout} />` to also pass `onUpdateMeta={handleUpdateMeta}`

