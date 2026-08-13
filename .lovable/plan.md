# Auto-populate categories and colormaps from catalogue legends

## Does the revised file address the recommendations?

Mostly yes. Comparing `clms-public-layers-3.json` with the previous version:

| Recommendation | Status in the new file |
|---|---|
| Named colormap hint | Added — `legend.colormapName` + `legend.reverse` on 11 legends (`magma` x7, `inferno` x3, `viridis` x1). All three names exist in our preset list. |
| Explicit data range | Added — `legend.min` / `legend.max` on 94 legends, plus `legend.steps`. |
| No-data separated from the ramp | Added — `legend.noData` array on 14 legends; sentinels no longer distort the ramp. |
| Units | Added — `legend.units` on 22 legends. |
| Unsampled entries | Improved — 67 of 90 continuous legends now `sampled: false` (was mostly sampled); all 23 discrete legends are unsampled. |
| Labels on discrete entries | **Not addressed** — discrete entries still carry only `value` + `color` (1098 entries, no `label`). |

Two smaller gaps remain: 4 legends still have no `type`, and 79 of 90 continuous legends have no `colormapName` (they are bespoke evalscript ramps, so a gradient fallback is still needed).

If you can add `label` to discrete entries in the generator, land it before this work — it removes the only invented value in the whole flow.

## What to build

### Discrete legends → Categories

For a layer with a `discrete` legend, populate `meta.categories` with one entry per legend entry: `value` and `color` straight from the legend, `label` from `entry.label` when present, otherwise the stringified value (editable afterwards). `noData` entries are excluded.

### Continuous legends → Colormap or gradient

1. When `legend.colormapName` is present and matches our preset list, write `meta.colormaps = [{ name, min: legend.min, max: legend.max, steps: legend.steps ?? entries.length, reverse: legend.reverse ?? false }]`.
2. When it is absent, attempt a match of the entry colours against `COLORMAP_DATA` (both directions, using `legend.min`/`max` for normalisation) and accept only a tight fit.
3. Otherwise fall back honestly: set `meta.min`/`meta.max` from the legend and `startColor`/`endColor` from the first and last ramp entries, with legend type `gradient` — a truthful two-stop ramp over the correct range rather than an unrelated preset.

`legend.units` populates `meta.units` when set. Legends with no `type` are treated as continuous when they have `min`/`max`, otherwise skipped.

### Browser surfacing

Each layer row in the catalogue browser shows a swatch or gradient strip preview plus a one-line statement of what will be applied — "Categories: 4 classes", "Colormap: magma (reversed), 0–1", or "Gradient 0–1 — no matching preset". Dataset rows link to `style.documentationUrl`, and each style links to its `evalscriptUrl`, both opening in a new tab.

## Technical notes

- **Types** (`src/types/service.ts`): add `CatalogueLegendEntry { value, color, label? }`, `CatalogueLegend { type?, entries, noData?, min?, max?, steps?, units?, colormapName?, reverse?, sampled?, sourceEntryCount? }`, `CatalogueLayerStyle { name, evalscriptUrl?, legend? }`; add `styles?` to `CatalogueLayer` and `style?` (documentation/evalscript URLs, `styleDiscoveryStatus`, `scripts`) to `CatalogueDataset`.
- **New util** `src/utils/catalogueLegend.ts`: `legendToCategories`, `matchNamedColormap` (reuses the sampling logic in `colormapUtils.ts` against `COLORMAP_DATA`), and `legendToStyleSuggestion` returning a discriminated result (`categories` | `colormap` | `gradient`) plus optional `units`.
- **Selection payload** (`CatalogueBrowser.tsx` → `CatalogueLayerSelection`): add optional `styleSuggestion`, carried through `DataSourceForm.tsx` as transient `__styleSuggestion` metadata, mirroring the existing `__temporalSuggestion` handling.
- **Apply on add** (`src/hooks/useLayerOperations.ts`): apply the suggestion to the parent layer only when `meta.categories` / `meta.colormaps` are unset, then strip the transient key before persisting. Values use the existing `Category` and `Colormap` shapes from `src/types/category.ts`, so no schema change is required.
- **Docs**: add a "Styles and legends" section to `docs/services/catalogues.md` covering the three outcomes and the source-schema expectations; rebuild with `mkdocs build --strict`.
- **Tests**: unit tests for `catalogueLegend.ts` covering a discrete legend, a `colormapName`-tagged legend (magma reversed), a bespoke ramp falling back to gradient, and no-data exclusion.

## Out of scope

- Fetching or parsing the evalscript JavaScript to recover ramps that have no `colormapName`.
- Any change to the exported config shape — only existing `meta` fields are written.
