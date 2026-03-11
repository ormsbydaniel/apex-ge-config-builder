

## Make Categories, Colormaps, RGB Composites, and Gradient mutually exclusive

### Approach

Add logic to determine which visualisation type (if any) is currently active, then disable the edit buttons for all other types with explanatory tooltips.

### Changes — `src/components/layers/components/LayerDataVisualisationSection.tsx`

1. **Compute active type** — derive a string like `'categories' | 'colormaps' | 'composites' | 'gradient' | null` from the existing `has*` flags (first match wins in priority order).

2. **Helper for disabled state** — for each of the four types, if another type is active, disable the pencil button and wrap it in a `Tooltip` explaining why (e.g., "Category editing disabled as colormaps defined").

3. **Import `Tooltip`** components from `@/components/ui/tooltip`.

4. **For each of the four sub-sections**, wrap the Pencil `Button` in a `Tooltip` when disabled:
   - Add `disabled` prop to the Button
   - Use `opacity-50 cursor-not-allowed` styling when disabled
   - Tooltip content: `"{Type} editing disabled as {activeType} defined"`

The delete buttons remain functional — deleting the active type re-enables the others.

