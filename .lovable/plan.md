## Add preview + confirmation step to Copy-to-steps

Extend `CopyToStepsDialog` with a two-stage flow: **Configure → Preview → Apply**. The preview enumerates, per target step, exactly which facets will change and how (replace vs append, with a per-facet before/after summary), and surfaces a prominent "cannot be undone" warning before the user confirms.

### UX flow

1. User configures facets + targets as today.
2. Primary button changes from `Copy to N steps` to `Review changes` (still disabled until `canApply`).
3. Clicking it swaps the dialog body to a **Preview** view (same modal, no new dialog).
4. Preview shows a scrollable list grouped by target step. Under each step, one row per selected facet with:
   - Facet name + strategy chip (`Replace` / `Append` / `Overwrite`)
   - Short before → after summary (counts + key identifiers, e.g. layer ids added / constraint labels added / new zoom+center / new base map id / panel focus+tab)
   - A neutral "No change" note when the computed result is identical to the current target (so the user sees no-ops rather than being surprised).
5. Warning banner at the top of the preview (destructive styling, `AlertTriangle` icon): "This will overwrite step contents on the selected targets. This action cannot be undone from within the copy dialog — use the app's history to revert if needed."
6. Footer buttons in preview mode: `Back` (returns to configure, preserves all selections), `Cancel`, `Apply to N steps` (destructive variant).

### Diff computation

Add a pure helper in `src/components/config/storymaps/copySteps.ts`:

```ts
export type FacetChange =
  | { kind: 'noop' }
  | { kind: 'replace'; before: string; after: string }
  | { kind: 'append'; added: string[]; keptCount: number };

export interface StepChangePreview {
  targetIndex: number;
  targetTitle: string;
  facets: Array<{ facet: CopyFacet; strategy: MergeStrategy; change: FacetChange }>;
}

export const buildCopyPreview(
  source: StoryStep,
  targets: { index: number; step: StoryStep }[],
  facets: CopyFacet[],
  strategies: Partial<Record<CopyFacet, MergeStrategy>>,
): StepChangePreview[]
```

Implementation reuses `applyFacetCopy` to get the post-copy target, then diffs per facet:
- `navigation` / `baseLayer` / `panelState`: compare via JSON equality → `noop` or `replace` with human summaries reusing the existing `facetSummary` shape.
- `activeLayers`: compare by `id` sets. `replace` → summarise removed + added ids. `append` → list ids actually added (skipping collisions).
- `constraints`: per-layer diff by constraint `label`. `replace` shows old→new label lists per touched layer; `append` lists newly added labels.

### Dialog changes (`CopyToStepsDialog.tsx`)

- Add `stage: 'configure' | 'preview'` state, reset to `'configure'` whenever `open` flips true (keeps existing dialog-state-in-useEffect memory rule).
- Extract the current body into a `ConfigureView`; add a `PreviewView` that consumes `buildCopyPreview` memoised on `{sourceStep, targets, facets, strategies}`.
- Replace the current `Copy to N steps` button with:
  - Configure stage: `Review changes` (disabled unless `canApply`).
  - Preview stage: `Back`, `Apply to N steps` (variant=`destructive`).
- `onApply` payload and call site are unchanged, so `SortableStepCard` / `SortableStoryGroup` wiring stays put.

### Files

- Edit `src/components/config/storymaps/copySteps.ts` — add `buildCopyPreview` + diff helpers (pure, unit-testable).
- Edit `src/components/config/storymaps/CopyToStepsDialog.tsx` — two-stage flow, warning banner, preview list rendering.

### Non-goals

- No new toast / no undo stack beyond existing app history.
- No changes to per-action vs whole-step entry points; both feed the same dialog and get the preview for free.
