
## Copy between steps

Add a way to copy configuration from one step to other steps within the same story, at two granularities:

1. **Per-action copy** — a small "copy to…" icon on each action row (Navigation, Base map, Active layers, Constraints, Panel state) inside a step. Copies just that one facet.
2. **Whole-step copy** — a new icon on the step card header (next to the JSON / Duplicate / Delete cluster) that lets the user pick *which facets* to copy and *which target steps* to copy them into.

Both entry points open the same target-picker modal, differing only in whether the "which facets" selector is shown.

### Entry points

- **Row-level icon**: `ActionsAndLayersSection.tsx`, on each `ActionCard`. New ghost-icon button using `ChevronsRight` (lucide's double forward chevron), placed immediately before the existing pencil button. Tooltip: "Copy to other steps".
- **Step-level icon**: `SortableStepCard.tsx`, added to the header button cluster (between JSON and Duplicate). Same `ChevronsRight` icon, orange styling to match Duplicate/JSON group is not required — use neutral outline. Tooltip: "Copy to other steps".

### Target-picker modal

New component `CopyToStepsDialog` under `src/components/config/storymaps/`. Props:

```ts
{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceStep: StoryStep;
  storySteps: StoryStep[];        // full sibling list including source
  sourceIndex: number;
  // 'single' locks facet to one kind; 'multi' shows the facet checklist
  mode: 'single' | 'multi';
  facet?: CopyFacet;              // required when mode==='single'
  onApply: (result: {
    targetIndices: number[];
    facets: CopyFacet[];
    // for facets that support it:
    mergeStrategy: Record<CopyFacet, 'replace' | 'append'>;
  }) => void;
}
```

`CopyFacet` union: `'navigation' | 'baseLayer' | 'activeLayers' | 'constraints' | 'panelState'`.

Modal contents:

- **Facets** (multi mode only) — checkbox list of the facets that are actually present on the source step; each row shows the facet label + a short summary of what would be copied (reuse the summary strings already computed in `ActionsAndLayersSection`).
- **Merge strategy** — for `activeLayers` and `constraints` only, show a `Replace` / `Append` radio pair:
  - `activeLayers`: Replace = overwrite target `activeLayers` entirely; Append = concat source layers not already present in the target (dedupe by `id`, source values win on collision only in Replace).
  - `constraints`: Replace = for each source layer, overwrite its `constraints` in the target; Append = merge constraint arrays by `label` (source additions appended).
  - Navigation, baseLayer and panelState are single-value → no strategy, always overwrite.
- **Target steps** — scrollable checkbox list of sibling steps. Each row shows `#<n> <title or id>`. Source step is listed but disabled with a "source" pill.
- **Bulk selects** above the list: `Select all`, `Deselect all`, `Future steps` (indices > sourceIndex), `Previous steps` (indices < sourceIndex). These set/replace the current selection.
- **Footer**: Cancel + `Copy to N step(s)` primary button (disabled when no targets, or in multi mode when no facets are checked).

### Applying the copy

The dialog does not mutate config directly — it calls `onApply`, and the caller composes a new `StoryStep[]` and dispatches a single update.

- **Row-level path** (per-action): handled inside `ActionsAndLayersSection` via a new prop `onCopyToSteps(targets, facet, strategy)` bubbled from `StepEditor` → `SortableStepCard` → `SortableStoryGroup`.
- **Step-level path**: handled directly in `SortableStepCard` via a new prop `onCopyStep(targets, facets, strategy)` bubbled to `SortableStoryGroup`.

`SortableStoryGroup` already owns the story's step array; it applies the requested facet copies to each target step and dispatches one `updateStory` (single `onSave` per Core memory rule about merging updates).

Facet copy semantics:

| Facet         | Copy behaviour                                                                 |
| ------------- | ------------------------------------------------------------------------------ |
| navigation    | overwrite `target.viewport` with a deep clone of `source.viewport`             |
| baseLayer     | overwrite `target.baseLayer`                                                   |
| activeLayers  | Replace: clone source array. Append: concat by unseen `id`                     |
| constraints   | Replace: for each source layer id present in target, overwrite `.constraints`. Append: merge by `label`, source additions appended. Layers in source but not target are added with just `{ id, constraints }`. |
| panelState    | overwrite `target.panelState` with a deep clone                                |

Deep clones use `structuredClone` to avoid shared references.

### Files to change / add

- Add `src/components/config/storymaps/CopyToStepsDialog.tsx` — the modal.
- Add `src/components/config/storymaps/copySteps.ts` — pure helpers: `applyFacetCopy(target, source, facet, strategy)` and the `CopyFacet` type.
- Edit `src/components/config/storymaps/actions/ActionsAndLayersSection.tsx` — per-row copy button + wiring; new optional prop `onCopyAction`.
- Edit `src/components/config/storymaps/StepEditor.tsx` — forward `onCopyAction` and `onCopyStep` down / up.
- Edit `src/components/config/storymaps/SortableStepCard.tsx` — new header icon + `onCopyStep` prop; render `CopyToStepsDialog` in multi mode.
- Edit `src/components/config/storymaps/SortableStoryGroup.tsx` — owns siblings list, wires `onCopyAction` / `onCopyStep` handlers, applies via `copySteps.ts`, dispatches one merged update per copy.

### Non-goals for this pass

- Cross-story copy (only within the same story).
- Undo beyond the standard config undo already provided by the reducer.
- Copying step `content` (title / description / auto-advance) — the whole-step copy modal is scoped to layer/navigation/panel facets only.
