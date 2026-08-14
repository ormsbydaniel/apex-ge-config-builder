# Supporting the v6 CLMS catalogue schema

## What is new in v6 (verified against the uploaded file)

115 datasets, 152 layers, 119 styles, 115 legends (23 discrete, 92 continuous).

**New layer-level band metadata** (not currently read by the builder):

| Field | Coverage | Notes |
|---|---|---|
| `units` | 113 layers | Human-usable unit, e.g. `mm/day`, `day` |
| `unitsRaw` | 42 | Verbose original wording |
| `sourceFormat` | 150 | e.g. `INT16` |
| `dataRange` / `dataRangeRaw` | 144 | Physical data range — **not** the same as the legend range (e.g. `A_ET_ENSEMBLE` has `dataRange` 0–20 mm/day but the legend visualises 0–10) |
| `scale` / `offset` | 149 | Non-trivial on 78 layers (0.001, 0.1 …) — DN to physical conversion |
| `bandMetadataSource` | 152 | Provenance URL for the above |
| `categoricalValueDescription` | 3 | e.g. "23 classes:" |

**New legend/label fields:** entry `label` (41 entries now labelled, up from 0) plus per-entry
`labelSource`; legend-level `labelSource` and `officialLabelCount`; style-level
`legendDiscovery` (2 styles, `status: "suppressed"` where the evalscript parser produced an
implausible range).

## Proposed changes

### 1. Types (`src/types/service.ts`)
Add to `CatalogueLayer`: `units`, `unitsRaw`, `sourceFormat`, `dataRange { min, max }`,
`dataRangeRaw`, `scale`, `offset`, `categoricalValueDescription`, `bandMetadataSource`.
Add `CatalogueLabelSource { type?, title?, url? }` used by both `CatalogueLegend.labelSource`
and `CatalogueLegendEntry.labelSource`; add `officialLabelCount` to the legend and
`legendDiscovery { status, reason?, parsedMin?, parsedMax?, message? }` to `CatalogueLayerStyle`.
All optional, so v5 files keep working.

### 2. Category labels flow through unchanged
`legendToCategories` already prefers `entry.label` over the stringified value, so the 41 new
official labels populate automatically once the file is loaded. The only change needed is to
stop *silently* claiming full coverage: where a discrete legend has `officialLabelCount` lower
than its entry count, the browser preview says "Categories: 23 classes (12 labelled)" so the
author knows which labels still need editing.

### 3. Units: prefer layer units over legend units
`legendToStyleSuggestion` currently only reads `legend.units`. Add a layer-aware wrapper
`layerStyleSuggestion(layer)` that falls back to `layer.units` (and never `unitsRaw`, which is a
sentence rather than a unit). This raises units coverage from 80 legends to ~113 layers, and
`meta.units` is populated on add exactly as it is today.

### 4. Scale, offset and data range — display only
`meta` has no `scale`/`offset` fields, and the viewer has no concept of them, so the plan does
**not** invent config fields. Instead:

- Show them in the catalogue browser layer row / metadata expander: "INT16 · scale 0.001 ·
  range 0–20 mm/day", with the `bandMetadataSource.url` as a "Band metadata" link.
- Where `dataRange` differs from the legend `min`/`max`, add a short note — "Legend shows
  0–10 of a 0–20 mm/day data range" — so the author can widen the colormap deliberately.
- Continue to take the colormap/gradient `min`/`max` from the legend, which is the intended
  visualisation range.

If you would rather have `scale`/`offset` written into the exported config, that needs a
matching schema, type and viewer change, and is worth treating as separate work.

### 5. Suppressed legends
When a style has `legendDiscovery.status === 'suppressed'`, show the reason in place of a
legend preview along with a link to the `evalscriptUrl`, instead of falling back to a
misleading gradient.

### 6. Provenance surfacing
Where a legend carries a `labelSource`, show a small "Labels: <title>" link in the preview so
the author can check the class names against the official product manual.

### 7. Docs and tests
- Extend `docs/services/catalogues.md` with a band-metadata section covering units, scale,
  offset, data range vs legend range, and label provenance; rebuild with `mkdocs build --strict`.
- Add tests to `src/utils/__tests__/catalogueLegend.test.ts`: labelled discrete legend keeps
  official labels, partial label counts are reported, layer units fall back correctly, and a
  suppressed legend yields no suggestion.

## Out of scope
- Fetching or parsing the evalscript JS files.
- Applying `scale`/`offset` numerically to layer values.
- Any change to the exported config shape beyond the existing `meta` fields.
