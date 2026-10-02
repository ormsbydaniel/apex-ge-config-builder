# Per-dataset visualisation settings: options and recommended approach

## Where things stand today
- The Multi-band visualisations editor reads histograms from the **first dataset only** and writes the same bands and style to **every** dataset in the layer.
- Categories, colormaps and gradient are stored once per layer. Vector styling is written to every vector dataset.
- So "apply to all" already happens, but there is no way to opt out.

## Core concept (shared by every visualisation tool)
By default every dataset uses the **same settings as the first dataset** (today's behaviour). Any dataset can be switched to **its own settings**. The datasets are peers; there is no hierarchy, only "same as first" or "own settings".

```text
COG A (first)  ── settings edited here
COG B          ── Same as first
COG C          ── Own settings (tighter stretch, summer)
COG D          ── Same as first
```

This works for every tool, because each one already produces "a style for a dataset".

## UI options considered

**Option 1 - Scope selector in the editor header (recommended)**
- A dropdown next to the title: "All datasets (shared)" / "COG A" / "COG B"... with Previous / Next arrows beside it.
- Choosing a single dataset loads *that* COG's histograms and edits its own settings. A badge shows "Same as first" or "Own settings", with "Reset to same as first" and "Copy to all".
- Good for time series (step through dates) and for swipe comparisons (pick the two COGs).

**Option 2 - Dataset strip/list as a third pane**
- A thin left column listing datasets with thumbnail state (shared / overridden). More visible, but uses space in an already full two-pane editor. Could be used for layers with many datasets later.

**Option 3 - Per-dataset edit from the dataset row**
- A "Visualisation" icon on each dataset row in the layer card, opening the editor already scoped to that dataset. Complements Option 1 rather than replacing it.

Recommendation: Option 1 as the main control, plus Option 3 as a shortcut. Option 2 kept in reserve.

## Batch mode ("compute per dataset")
- In the shared scope, the stretch selector gains a toggle: **"Compute per dataset"**.
- When on, the chosen rule (e.g. mean +/- 2 SD, 2-98% percentile) is computed separately for each COG in the background, with a progress list ("3 of 12 done", failures listed with retry).
- Each COG gets its own min/max as an override, but stays tagged as "batch" so re-running or changing the rule updates them all. Manual edits on one COG turn it into a normal override.
- Uses the existing sampled histogram fetch with a small concurrency limit and the existing timeouts, so large layers don't stall the browser.
- Indices: same idea applied to the index value range.

## How it applies per tool
| Tool | Same as first | Own settings | Batch |
|---|---|---|---|
| RGB composites | bands + stretch | own recipe, bands and stretch | per-COG stretch |
| Spectral indices | recipe + range + colormap | own recipe, bands, range, colormap | per-COG range |
| Colormaps / gradient | first dataset's colormap | own colormap and range | per-COG min/max |
| Categories | first dataset's categories | own category list | n/a |
| Vector styling | rules | own rule set | n/a |

## Mixing visualisation types per dataset
- A dataset with own settings can use any recipe or bands, and can switch between composite and index (e.g. NDVI on one, Agriculture composite on another).
- Main use: swipe layers comparing two visualisations, either of the **same scene** (the same COG added twice) or of **different scenes**.
- "Add same COG again" shortcut in the editor, so a same-scene comparison doesn't need the COG re-entered by hand.
- The layer card lists each distinct visualisation (e.g. "NDVI - 1 dataset", "Agriculture - 1 dataset") instead of a single summary.
- Mutual exclusivity of visualisation types stays per dataset rather than per layer.

## Suggested phasing
1. **Phase 1 - Multi-band:** scope selector + Previous/Next, per-COG histograms, own recipe/bands/stretch, composite-or-index per dataset, reset / copy to all, layer-card summary ("2 of 5 with own settings").
2. **Phase 2 - Batch compute** for composites and indices.
3. **Phase 3 - Extend** the same scope selector to colormaps/gradient, categories and vector styling.

## Technical details
- Multi-band: each data item already carries `bands`, `style`, `spectralIndex`, so per-dataset recipes and bands need no new rendering fields. Add an optional `styleSource?: 'first' | 'own' | 'batch'` marker (plus batch rule, e.g. `{ method: 'meanStd', k: 2 }`) on the data item, kept in sync in `configSchema.ts`, `types/config.ts` and `useValidatedConfig.ts`. Saving the first dataset rewrites only items marked `first`/`batch`.
- No separate layer-level copy of settings: "same as first" is resolved from the first dataset, avoiding drift.
- Editor: `RgbCompositeEditorDialog.tsx` gains a `scopeIndex` state; the histogram cache key becomes `(url, band)` instead of `band`; mode (composite/index) becomes per scope.
- Batch: new pure util `computeBatchStretch(items, rule, opts)` in `src/utils/rgbComposite/` using `fetchBandHistogram`, concurrency 3, `AbortController` on dialog close; unit tests for the stretch maths.
- Phase 3: colormaps/categories move from layer `meta` to optional per-item settings, with layer `meta` still read as the "first" value for existing configs (backwards compatible).

## Test and development config
- Develop and test against the **Multispectral datasets** test config (manifest id `multispectral-datasets`, `test-configs/config-multispectral-datasets.json`), loadable from Load Configuration under "Test & development".
- It contains:
    - **East London - time series, natural colour**: 11 monthly Sentinel-2 ARD COGs, bands 3-2-1, each with an identical saved stretch. Main case for stepping through datasets with Previous/Next and for the per-COG batch stretch (seasonal variation).
    - **East London - time series, agriculture**: the same 11 COGs with bands 9-7-1. Good for the "different recipe on the same scene" comparison, and for checking existing configs load as "Same as first" without any change.
    - **Bristol Sentinel 2 - true colour composite**: single COG; checks that single-dataset layers show no scope selector.
- Existing items have no new marker; loading them must treat every dataset as "Same as first" and export unchanged until edited.

## Testing approach
- Unit tests (Vitest) for: resolving "same as first" vs own settings, saving the first dataset only rewrites "same as first" items, batch stretch maths (mean +/- k SD, percentiles), and a round-trip of the multispectral test config through schema validation with the new marker.
- Typecheck and build after each phase.
- Full UI testing is left to you.
