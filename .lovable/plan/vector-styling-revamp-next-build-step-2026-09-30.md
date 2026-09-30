# Vector styling revamp: next build step

## What the test config gives us

The "Vector datasets" test config has six vector layers. Each one tests something different:

| Layer | Data | Current style | Good for testing |
|---|---|---|---|
| Field Boundaries | 40 FlatGeoBuf files (polygons) | Plain red outline | Uniform recipe, sampling FlatGeoBuf files |
| HV Transmission Grid | 1 GeoJSON (lines) | `case` expression on `current` / `voltage` | Opening existing complex styles; Categorised and Graduated recipes on lines |
| Oslo NO2 | 694 GeoJSON files (polygons) | `interpolate` ramp on `no2_ugm3` | Graduated recipe; round-tripping stops; sampling only the first file |
| External GeoJSON Example | Countries (polygons) | None | Categorised recipe (`name`), Labels, starting with an empty style |
| AGB statistics / World Cover statistics | Statistics layers | None | Empty-style entry path, Filter/Highlight |

These layers cover the three main situations: an empty style, a simple style and a complex style written with expressions.

## Phase 2: recipe entry (build next)

1. **Recipe gallery.** When a layer has no style, the styling dialog opens on five cards: Categorised, Graduated, Uniform, Labels and Filter/Highlight, plus "Start from scratch". When a layer already has a style, the header gets a "New from recipe" button.
2. **Recipe wizard.** It takes one short screen per recipe:
    - Pick a field. The list is filled by sampling the layer's first data file. Numeric and text fields are marked.
    - Pick a palette: categorical palettes for Categorised, colour ramps for Graduated.
    - Values are auto-detected (up to 20 categories, or min/max with equal-interval or quantile breaks) and can be edited before you apply them.
    - If sampling fails, you can enter values yourself.
3. **Replace or Append.** If the layer already has rules, you choose whether the new rules replace them or are added to them. The single "else" rule always stays last.
4. The generated rules go into the existing rule cards. This means results can be checked in Preview straight away, before the two-pane editor is built.

## Phase 3: two-pane rule editor (after Phase 2 sign-off)

- Left side: a compact list of rules showing the name, filter summary, colour swatches, visibility toggle and reorder controls.
- Right side: tabs for the selected rule (Fill / Stroke / Marker / Label / When).
- Each property shows its mode dropdown (Constant / From field / By zoom / Expression) at all times.
- A "+ Add property" picker gives access to the advanced properties (dash, cap/join, label offsets, icon anchor and so on).
- The {JSON} editor stays. The dialog gets wider.

## Verification against the test config

- Opening HV Grid and Oslo must not change their saved style when you save without edits. This is a round-trip check on `case` and `interpolate`.
- Graduated on Oslo `no2_ugm3` and Categorised on Countries `name` must render correctly in Preview.
- Field Boundaries: sampling reads only the first FlatGeoBuf file and stays within the 500-feature cap.
- You do the visual testing. I will not publish anything.

## Docs

- Update `docs/layers/vector-styling.md` with a "Styling recipes" section. Add screenshots with the screenshot script, then run a strict MkDocs build.
- Add a 2.7.0 announcement entry once you have signed off.

## Technical details

- New components in `src/components/vectorStyle/`: `RecipeGallery.tsx`, `RecipeWizard.tsx`, `ReplaceOrAppendDialog.tsx`. They connect into `VectorStylingDialog.tsx`.
- They use the existing `src/utils/vectorStyle/recipes.ts`, `sampleSourceData.ts` and `palettes.ts` (already tested). Output goes through `toFlatStyleArray`, so there are no config schema changes.
- Sampling uses the first `data[]` entry only, is cached per URL (react-query) and never throws.
- Add a round-trip unit test for the HV Grid and Oslo styles (`fromFlatStyleArray` → `toFlatStyleArray`, which must give identical output).
- Phase 3 files: `RuleListPane.tsx` and `RuleEditorPane.tsx`. The add-property picker uses `propertyCatalogues.ts` entries marked `advanced: true`.
