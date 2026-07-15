Add a "Base map" action to storymap steps that lets the user pick a single basemap for a step, plus a summary row on the step card. Exclude base layers from the Active layers list.

## Changes

### 1. `src/components/config/storymaps/actions/types.ts`
- Extend `ActionKind` with `'baseLayer'`.
- Add `ACTION_META.baseLayer` with category `'Layer display'`, label `'Base map'`, description "Choose which base map is visible for this step.", singleton `true`.
- Extend `hasKind` — returns `!!step.baseLayer`.
- Extend `warningsForAction` — return `[]` for `baseLayer` (no cross-ref warnings yet).

### 2. `src/components/config/storymaps/actions/ActionEditors.tsx`
- Add a new `BaseLayerEditor` modal component:
  - Props: `open`, `onOpenChange`, `step`, `sources`, `onSave(baseLayer: string | undefined)`.
  - Renders a `Select` populated from `sources.filter(s => s.isBaseLayer)`, plus a leading `"None"` (`__none__`) option that clears the field.
  - Initialises from `step.baseLayer` inside a `useEffect` watching `open` (per project rule).
  - On save, emits `undefined` when `__none__`, otherwise the selected source `id`.
  - Shows empty-state text when no base layers are configured.

### 3. `src/components/config/storymaps/actions/ActionsAndLayersSection.tsx`
- Import `BaseLayerEditor`, add `Map` icon (lucide) to `ACTION_ICON.baseLayer`.
- Build `layerOptions` from **non-base** sources only (`.filter(s => !s.isBaseLayer)`). Base map picker uses raw `sources` directly. This removes base layers from Navigation "fit to layer", Active layers "Add layer", and Panel state "Focus layer" — the primary request is Active layers; the others become consistent for free (base layers wouldn't be valid overlays there anyway).
- Extend `AddActionMenu` category map so `'Layer display'` includes `['activeLayers', 'baseLayer']`.
- Extend `OpenEditor` union with `{ kind: 'baseLayer' }`.
- Extend `removeAction('baseLayer')` → `patch({ baseLayer: undefined })`.
- Add a new item to `items[]` when `hasKind(step, 'baseLayer')` and allowed:
  - `title: 'Base map'`, `summary`: the selected source's `name` (or the id as fallback, `<em>unknown</em>` when not resolvable), `onEdit`/`onRemove` wired.
- Mount `<BaseLayerEditor …>` alongside the other editors, saving via `patch({ baseLayer })`.

### 4. Types
- `StoryStepV2.baseLayer` already exists (added last turn); no schema/type changes needed.

## Out of scope
- No cross-reference warning ("unknown base layer id" / "not isBaseLayer") — can follow later in `storyValidation.ts`.
- No re-ordering of the picker menu; base map appears below active layers within "Layer display".
- No changes to config sanitisation (stories are already spread through unchanged).
