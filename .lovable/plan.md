## Split "Actions & Layers" into three sections

Restructure the step editor so actions are grouped by purpose instead of a single flat list.

### New section layout in `StepEditor`

Below the existing **Content** section, render three sibling sections in order:

1. **Navigation** — icon: `Compass`
   - Contains: `navigation` action (viewport zoom+center OR fit-to-layer)
2. **Layers** — icon: `LayersIcon`
   - Contains: `activeLayers`, `focusLayer`
3. **Actions** — icon: `SlidersHorizontal` (or keep `Film`)
   - Contains: `layerControl` (apply constraints, repeatable), `expandPanels`

Each section has:
- Its own header row (icon + title + count + "Add …" button on the right)
- Its own action cards below, indented like today
- Its own Add-picker dialog scoped to that section's action kinds

### Implementation approach

Refactor `ActionsAndLayersSection.tsx` into a reusable `ActionGroupSection` that accepts:
- `title`, `icon`
- `allowedKinds: ActionKind[]`
- `step`, `sources`, `warnings`, `onChange`

It keeps the current internal logic (item builder, editor dialogs, add picker) but filters `items` and the picker options to `allowedKinds`. All five editors (`NavigationEditor`, `ActiveLayersEditor`, `FocusLayerEditor`, `LayerControlEditor`, `ExpandPanelsEditor`) stay unchanged.

`StepEditor.tsx` renders three `ActionGroupSection` instances with:
- Navigation: `['navigation']`
- Layers: `['activeLayers', 'focusLayer']`
- Actions: `['layerControl', 'expandPanels']`

The `bare` prop and the current default header stay for backward compatibility but the step editor uses the new three-section layout directly.

### Files to change

- `src/components/config/storymaps/actions/ActionsAndLayersSection.tsx` — extract a `ActionGroupSection` component (or a new sibling file `ActionGroupSection.tsx`) and keep a thin default export for any other callers.
- `src/components/config/storymaps/StepEditor.tsx` — replace the single `<ActionsAndLayersSection …>` with three `<ActionGroupSection …>` blocks.
- `src/components/config/storymaps/actions/types.ts` — no schema changes; category grouping stays but the picker now uses `allowedKinds` per section.

No changes to Zod schemas, story validation, or the JSON shape of a step.
