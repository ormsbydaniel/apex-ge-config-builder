# Simplify the dataset control: cycle only, remove badge / reset / copy-to-all

## Goal

The dataset control in the multi-band visualisations editor should simply cycle through the datasets (Previous / dropdown / Next). The status badge ("First dataset", "Same as first", "Own settings", "Per-dataset stretch"), the "Reset to same as first" link, the "Copy to all" link and the explanatory hint line are removed — stretch scope is already governed by the "Apply to all datasets" checkbox, and composite/recipe scope by the "This dataset / All datasets" confirmation dialog.

## Changes

### 1. Dataset row in `RgbCompositeEditorDialog.tsx` (multi-COG layers only)

Keep:
- "Dataset" section label, Previous/Next buttons, dataset dropdown (labels still show `n. date · visualisation name`, so differences between datasets stay visible).

Remove:
- The status `Badge` and the `statusLabel` helper.
- The "Reset to same as first" link button and `handleResetToFirst`.
- The "Copy to all" link button and `handleCopyToAll`.
- The hint paragraph ("Changes here also update datasets marked 'Same as first'…" / "…apply only to this dataset…").

The row collapses to label + Previous / Select / Next; left-pane dividers and spacing stay as they are.

### 2. Scope semantics follow from the removal

With "Copy to all" gone, the confirmation dialog's **"All datasets"** becomes the only way to unify datasets, so it must genuinely apply to all:

- In `src/utils/rgbComposite/styleScope.ts`, `applyCompositeStyle` with `all = true` currently skips datasets marked `own`. Change it so an all-datasets change applies to every COG dataset and clears their `styleSource` marker (recipe + bands updated; each dataset keeps its own saved RGB ranges, as today).
- "This dataset" behaves as now (marks that dataset `own` when it diverges).
- Stretch via "Apply to all datasets" is unchanged: it already stretches every dataset using its own bands and preserves `own` markers — stretch scope stays independent of recipe scope, as agreed earlier.

The `first`/`own`/`batch` markers stay in the schema and exported JSON exactly as they are; only the editor's UI and the meaning of "All datasets" change. No changes to save format, batch stretch, the histogram cache, index mode, or the layer-card "n of m datasets with own settings" summary.

### 3. Cleanup

- Remove the now-unused imports (`copyToAll`, `resetToFirst` from `perDataset.ts`) and dead handlers. The utilities themselves stay in `perDataset.ts` (still covered by existing tests); only the dialog stops using them.
- Update `styleScope.test.ts` for the new all-datasets behaviour (all-dataset change now also updates `own` datasets and clears their marker).

## Verification

- Focused Vitest: `styleScope.test.ts`, `perDataset.test.ts`, `BandHistogram.test.tsx`.
- Typecheck (`tsgo`) and build log clean.
- Playwright against the "Multispectral datasets" test config: East London (11 COGs) shows a dataset row with only Previous / dropdown / Next — no badge, links or hint; Bristol (single COG) unchanged with no dataset row. Detailed UI testing stays with you.
