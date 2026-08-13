# Auto-populate categories and colormaps from catalogue legends

## Answers to your two questions

**1. Are there named colormaps, or explicit breakpoints?**

Explicit breakpoints only. Every `styles[].legend` is `{ type, entries: [{ value, color }], sampled?, sourceEntryCount? }` — there is no ramp name anywhere in the file. Across the 115 datasets: 152 layers, 119 styles, 117 legends (90 `continuous`, 23 `discrete`, 4 with no type).

I tested how well those ramps match our 43 named colormaps in `src/constants/colormapData.ts` (normalising each legend to 0–1 after dropping negative/no-data entries and comparing RGB):

- 11 of 89 continuous legends match a named preset closely (e.g. `magma` reversed, `inferno`, `viridis`).
- The median match error is ~101/255 per channel — i.e. most CLMS ramps are bespoke evalscript ramps with no equivalent in our preset list.

So name-matching alone would cover roughly 12% of layers. Also note the values are irregularly spaced (e.g. `-1`, `0`, `0.105`, `0.158`, …) and `sampled: true` means entries were down-sampled from a larger source ramp.

**2. Would a different source schema help?**

Yes, three additions would make this near-lossless:

- `legend.colormapName` — when the evalscript ramp is a known named ramp (viridis/magma/turbo…), emit the name plus `min`/`max`. That maps 1:1 onto our `Colormap { name, min, max, steps, reverse }`.
- `legend.noData: [{ value, color }]` separated from the ramp entries, and explicit `min`/`max` for the data range — today the `-1 → #FFFFFF` and `0 → grey` sentinels sit inline and distort any range inference.
- `label` on discrete entries (and ideally `units`). Discrete entries currently carry only `value` + `color`, so class names have to be invented.

Emitting unsampled entries (`sampled: false`) for discrete legends would also avoid class loss.

## What to build now (works with the file as it stands)

### Discrete legends → Categories

When a catalogue layer with a `discrete` legend is added, populate the layer's `meta.categories` with one entry per legend entry: `value` from the legend, `color` from the legend, `label` from the entry's `label` when the source gains one, otherwise the stringified value (editable afterwards).

### Continuous legends → Colormap, with honest fallback

1. Drop no-data sentinels (negative values, and leading pure-grey/white entries) to get the data ramp and its `min`/`max`.
2. Match the remaining ramp against `COLORMAP_DATA` (both directions). If the RMS colour error is under a tight threshold, set `meta.colormaps = [{ name, min, max, steps: entries.length, reverse }]`.
3. If no preset matches, do not force a wrong ramp: set `meta.min`/`meta.max` and the gradient `startColor`/`endColor` from the first and last ramp entries, and set the legend type to `gradient`. The layer then renders a truthful two-stop gradient over the correct range rather than an unrelated preset.

In both cases nothing is invented silently — the catalogue browser shows what will be applied before the layer is added.

### Browser surfacing

In the catalogue browser layer list, each layer with a legend gets a small swatch/gradient strip preview plus a line stating what will be applied ("Categories: 4 classes", "Colormap: magma (reversed), 0–1", or "Gradient 0–1 — no matching preset"). Dataset rows gain a link to the CLMS `style.documentationUrl` and, per style, the evalscript URL, opening in a new tab.

## Technical notes

- **Types** (`src/types/service.ts`): add `CatalogueLayerStyle { name, evalscriptUrl?, legend? }` with `CatalogueLegend { type?: 'continuous' | 'discrete'; entries: { value: number; color: string; label?: string }[]; sampled?: boolean; sourceEntryCount?: number }`; add `styles?: CatalogueLayerStyle[]` to `CatalogueLayer` and `style?: { documentationUrl?, evalscriptDirectoryUrl?, githubArchiveUrl?, styleDiscoveryStatus?, scriptCount?, scripts? }` to `CatalogueDataset`.
- **New util** `src/utils/catalogueLegend.ts`: `splitNoDataEntries`, `legendToCategories`, `matchNamedColormap` (reuses `COLORMAP_DATA` sampling logic from `colormapUtils.ts`), and `legendToStyleSuggestion` returning a discriminated result (`categories` | `colormap` | `gradient`).
- **Selection payload** (`CatalogueBrowser.tsx` → `CatalogueLayerSelection`): add an optional `styleSuggestion`, carried through `DataSourceForm.tsx` as transient `__styleSuggestion` metadata in the same way `__temporalSuggestion` already is.
- **Apply on add** (`src/hooks/useLayerOperations.ts`): alongside the existing temporal handling, apply the style suggestion to the parent layer only when `meta.categories`/`meta.colormaps` are currently unset, then strip the transient key before persisting. Category/colormap shapes come from `src/types/category.ts` and go through the existing `meta` path, so schema sync is unchanged.
- **Docs**: extend `docs/services/catalogues.md` with a "Styles and legends" section covering the three outcomes and the source-schema recommendations above; rebuild with `mkdocs build --strict`.
- **Tests**: unit tests for `catalogueLegend.ts` covering a discrete legend, a preset-matching continuous legend (magma reversed), and a bespoke ramp falling back to gradient.

## Out of scope

- Fetching or parsing the evalscript JavaScript to recover the original ramp.
- Any change to the exported config shape — only `meta.categories`, `meta.colormaps`, `meta.min`/`max`, `startColor`/`endColor` are written, all existing fields.
