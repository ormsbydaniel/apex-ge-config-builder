## Add "Content description" as a copyable facet with three merge strategies

Extend the copy-between-steps flow so a step's `content.description` can be copied to other steps using **Replace**, **Insert at start**, or **Insert at end**.

### Type & helper changes (`src/components/config/storymaps/copySteps.ts`)

- Extend `CopyFacet` union with `'contentDescription'`.
- Add to `FACET_LABEL`: `contentDescription: 'Description'`.
- Extend `MergeStrategy` to `'replace' | 'append' | 'insertStart' | 'insertEnd'`.
  - `append` stays valid for `activeLayers` / `constraints`.
  - `insertStart` / `insertEnd` are only valid for `contentDescription`.
- Add per-facet strategy metadata so the dialog can render the right radio options:
  ```ts
  export const FACET_STRATEGIES: Record<CopyFacet, MergeStrategy[]> = {
    navigation: [],
    baseLayer: [],
    activeLayers: ['replace', 'append'],
    constraints: ['replace', 'append'],
    panelState: [],
    contentDescription: ['replace', 'insertStart', 'insertEnd'],
  };
  ```
  Replace the current `STRATEGY_FACETS` usage in `CopyToStepsDialog` with this map (facets whose array is non-empty show a strategy chooser; the labels come from a `STRATEGY_LABEL` map).
- `facetPresent`: return `!!step.content?.description?.trim()` for `contentDescription`.
- `applyFacetCopy` new case:
  - `replace`: set `content.description` to source description (preserving existing `content.title`).
  - `insertStart`: `sourceDesc + "\n\n" + targetDesc` (skip separator if either side empty).
  - `insertEnd`: `targetDesc + "\n\n" + sourceDesc` (same rule).
  - Always returns a new `content` object; leaves `title` untouched.
- `diffFacet` new case: string compare; `noop` if unchanged, else a `replace`-kind change with before/after summaries truncated to ~80 chars (ellipsis) so the preview list stays compact. For insert strategies the diff naturally shows the merged result — the strategy chip already tells the user how it was produced.

### Dialog changes (`CopyToStepsDialog.tsx`)

- Add `Description` as a facet checkbox in `ConfigureView`, gated by `facetPresent(sourceStep, 'contentDescription')`.
- Replace the current two-option Replace/Append toggle with a small radio/segmented control driven by `FACET_STRATEGIES[facet]`:
  - `replace` → "Replace"
  - `append` → "Append" (layers/constraints only)
  - `insertStart` → "Insert at start"
  - `insertEnd` → "Insert at end"
- Default strategy for `contentDescription` is `replace`.
- Preview rendering: reuse the existing `replace`-kind row, prefixed by the strategy chip so the user can see whether the merged text came from Insert at start/end vs Replace.

### Non-goals

- No changes to the copy entry points, dispatch wiring, or warning banner.
- Title is not copied — description only, as requested.
- No smart de-duplication when inserting (a straight text concat with a blank-line separator).

### Files

- Edit `src/components/config/storymaps/copySteps.ts` — add facet, strategies, apply + diff logic.
- Edit `src/components/config/storymaps/CopyToStepsDialog.tsx` — new checkbox, three-way strategy control, preview label wiring.
