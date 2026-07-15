
## Goal

Restore the previous UX where **constraints** appear as their own entry in Layer Settings → **Add action** and as their own row inside the Active Layers group on the step card — without touching the JSON schema (constraints stay nested inside each `activeLayers[]` entry, as they are now).

## Scope

UI only. No changes to `src/schemas/storySchema.ts` or `src/types/story.ts`. The action is a pure UI façade over the existing per-layer `constraints` arrays.

## Changes

### 1. `src/components/config/storymaps/actions/types.ts`
- Add `'constraints'` to the `ActionKind` union.
- Add `ACTION_META.constraints`:
  - category: `'Layer display'`
  - label: `'Apply constraints'`
  - description: `'Apply data constraints (ranges, category filters) to the step's active layers.'`
  - singleton: `true`
- `hasKind(step, 'constraints')` → true when any active layer has a non-empty `constraints` array.
- `warningsForAction(all, 'constraints')` → warnings whose `field` matches `activeLayers[*].constraints*` (reuse the existing `activeLayers` prefix filter, further filtered on `.constraints`).

### 2. `src/components/config/storymaps/actions/ActionsAndLayersSection.tsx`
- Add `SlidersHorizontal` (or existing `Filter`) icon to `ACTION_ICON.constraints`.
- Extend `AddActionMenu.byCategory['Layer display']` to include `'constraints'` (after `activeLayers`, before `baseLayer`).
- Extend `OpenEditor` union with `{ kind: 'constraints' }`.
- Add a new item builder for constraints under the Active layers item:
  - Only pushed when `hasKind(step, 'constraints')` AND `isAllowed('constraints')`.
  - `title: 'Constraints'`
  - `summary`: aggregated across active layers, e.g. `"layerA: label1, label2 · layerB: label3"`, truncated to 4 layer chunks with `+N more`.
  - `pills`: total-count pill `<X constraints>`.
  - `onEdit`: opens the new `ConstraintsEditor`.
  - `onRemove`: patches `activeLayers` to strip `constraints` from every layer.
- `removeAction('constraints')` clears `constraints` on every `activeLayers[]` entry.
- Mount a new `<ConstraintsEditor …>` alongside the existing editors, wired to `patch({ activeLayers })`.

### 3. `src/components/config/storymaps/actions/ActionEditors.tsx`
- Extract the existing per-layer constraint UI (already inside `ActiveLayersEditor`, ~lines 429–520) into a shared internal component (e.g. `LayerConstraintsBlock`) so it can be reused.
- Add a new exported `ConstraintsEditor` modal:
  - Lists every layer currently in `step.activeLayers` (read-only — this dialog only edits constraints, not layer membership).
  - For each layer, renders the shared `LayerConstraintsBlock` fed by that layer's source constraints.
  - On save, emits the updated `activeLayers[]` array (unchanged layer set, updated `constraints` per layer).
  - Empty state when there are no active layers: message pointing the user to add Active layers first, with the Save button disabled.
- Keep the existing per-layer constraints UI inside `ActiveLayersEditor` intact (both entry points continue to work — they read/write the same underlying data).

### 4. `src/components/config/storymaps/StepEditor.tsx`
- Update the `ActionsAndLayersSection` invocation for the Active layers group to include `'constraints'` in `allowedKinds`:
  ```
  allowedKinds={['activeLayers', 'baseLayer', 'constraints']}
  ```

## Behaviour notes

- The action is presented as if it were its own top-level thing, but under the hood it just mutates `step.activeLayers[i].constraints`. No schema drift.
- Because it depends on `activeLayers`, the Add-action menu will surface it whether or not any active layer exists; if none exist, the editor opens in its empty state (rather than disabling the menu entry) so the wording matches the pre-refactor UX.
- Existing per-layer constraints controls inside `ActiveLayersEditor` remain — power users editing an active layer still see and edit its constraints there. Both surfaces write to the same source of truth.

## Out of scope

- No changes to the JSON schema, types, migration logic, or exported config shape.
- No changes to how constraints render at runtime.
