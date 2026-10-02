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
| Tool | Shared | Per-dataset override | Batch |
|---|---|---|---|
| RGB composites | bands + stretch | own stretch (and optionally bands/recipe) | per-COG stretch |
| Spectral indices | recipe + range + colormap | own range / colormap / recipe | per-COG range |
| Colormaps / gradient | layer meta | own colormap range | per-COG min/max |
| Categories | layer meta | rarely useful; override allowed later | n/a |
| Vector styling | rules | own rule set | n/a |

Swipe comparisons: allowing a different recipe per COG (e.g. composite on one, NDVI on the other) falls out naturally from per-dataset overrides.

## Suggested phasing
1. **Phase 1 - Multi-band only:** scope selector + Previous/Next, per-COG histograms, override / reset / copy to all, layer-card badge ("2 of 5 overridden").
2. **Phase 2 - Batch compute** for composites and indices.
3. **Phase 3 - Extend** to colormaps/gradient and vector styling using the same scope selector; categories last if needed.

## Questions to settle before building
- Does the Explorer accept per-dataset colormap/category settings, or only layer-level ones? This decides whether Phase 3 needs viewer changes. Multi-band and vector styles are already per dataset, so Phases 1-2 need no viewer change.
- Per-dataset overrides: stretch only, or also allow a different recipe or bands?

## Technical details
- Multi-band: no schema change needed. Each data item already carries `bands`, `style`, `spectralIndex`. Add an optional `styleSource?: 'shared' | 'override' | 'batch'` marker (plus batch rule, e.g. `{ method: 'meanStd', k: 2 }`) on the data item, kept in sync in `configSchema.ts`, `types/config.ts` and `useValidatedConfig.ts`. Saving "shared" rewrites only items marked shared/batch.
- Shared defaults for multi-band are taken from the first item marked shared (no separate layer-level copy, avoiding drift).
- Editor: `RgbCompositeEditorDialog.tsx` gains a `scopeIndex` state; the histogram cache key becomes `(url, band)` instead of `band`.
- Batch: new pure util `computeBatchStretch(items, rule, opts)` in `src/utils/rgbComposite/` using `fetchBandHistogram`, concurrency 3, `AbortController` on dialog close; unit tests for the stretch maths.
- Colormaps/categories override (Phase 3) would add optional per-item `meta` overrides; only once viewer support is confirmed.
