# Auto-populate categories and colormaps from catalogue legends

## Review of `clms-public-layers-4.json`

Effectively all the schema recommendations are now in place:

| Recommendation | Status |
|---|---|
| Named colormap hint | `legend.colormapName` + `legend.reverse` on 11 legends (`magma` x7, `inferno` x3, `viridis` x1) — all three exist in our preset list. |
| Explicit data range | `legend.min` / `legend.max` / `legend.steps` on all 94 continuous legends. |
| No-data separated | `legend.noData` on 14 legends; sentinels no longer sit in the ramp. |
| Units | `legend.units` on 15 legends (was 22 in v3 — worth checking whether the tightened parser dropped some valid units). |
| Legend type always present | Fixed — 94 continuous + 23 discrete, no untyped legends (v3 had 4). |
| Unsampled entries | 90 of 117 legends `sampled: false`; 27 still sampled with `sourceEntryCount`. |
| Labels on discrete entries | Field now supported, but only 3 of 1098 entries actually carry a `label`. |

Remaining, and both handled by the build plan rather than the generator: 83 of 94 continuous legends have no `colormapName` (bespoke evalscript ramps → gradient fallback), and discrete classes will mostly show their value as the label until the generator can extract class names.



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
