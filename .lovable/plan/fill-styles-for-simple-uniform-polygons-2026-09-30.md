# Fill styles for Simple uniform polygons

Add a **Fill style** choice to the Simple uniform recipe when the data is drawn as polygons, alongside the existing Line style and Line weight choices for lines.

## What you get

- A **Fill style** dropdown appears when "Symbolise as" is Polygons:
  - **Solid** — today's behaviour, a plain coloured fill.
  - **Hatch** — repeating diagonal lines in the chosen fill colour.
  - **Cross hatch** — repeating crossed diagonal lines in the chosen fill colour.
- The outline colour control stays as it is, so hatched polygons can still have a solid edge.
- The new rule is named after what you picked — "Fill and outline", "Hatched", or "Cross-hatched" — so the left-hand rule list reads clearly.
- Nothing changes for lines or points, and existing styles are untouched.

## How it works

OpenLayers has no built-in hatch fill; the only pattern mechanism is a small repeating image tinted by the fill colour. So the hatch tiles are generated as compact inline SVG data URIs inside the recipe utilities, and the rule writes standard OpenLayers properties: `fill-pattern-src`, `fill-pattern-size`, `fill-pattern-offset`, plus `fill-color` as the tint. Solid writes `fill-color` only, exactly as now.

## Technical details

- `src/utils/vectorStyle/recipes.ts`
  - Add `UniformFillStyle` (`solid | hatch | cross-hatch`) and `UNIFORM_FILL_STYLES` next to the existing line-style presets, so the wizard and the generated OpenLayers properties cannot drift apart.
  - Add `fillStyleProps(fillStyle, color)` mirroring `lineStyleProps`: solid returns `{ 'fill-color': color }`; hatch and cross-hatch add `fill-pattern-src` (inline SVG tile), `fill-pattern-size` `[8, 8]`, `fill-pattern-offset` `[0, 0]`.
  - Add `UNIFORM_FILL_STYLE_NAMES` and extend `uniformRuleName` so polygon rules are named from the chosen fill style.
  - `buildUniformRecipe` accepts an optional `fillStyle`, defaulting to `solid`.
- `src/components/vectorStyle/RecipeWizard.tsx` — render a Fill style Select for `recipe === 'uniform' && geometry === 'polygon'`, and pass `fillStyle` into `buildRecipeRules`.
- `src/utils/vectorStyle/propertyCatalogues.ts` — add `fill-pattern-src`, `fill-pattern-size`, `fill-pattern-offset` to `FILL_PROPS` (advanced) so the two-pane editor's Fill tab shows the pattern properties instead of treating them as unknown.
- `src/utils/vectorStyle/__tests__/recipes.test.ts` — tests for each preset's generated properties, rule naming, and flat-style serialisation; polygons with solid fill unchanged.
- `docs/layers/vector-styling.md` — short note on fill styles and that they use a tinted repeating tile.

## Verification

- `bunx vitest` and `bunx tsgo --noEmit -p tsconfig.app.json`.
- Strict MkDocs build after the docs edit.
- Visual check left to you: create a Simple uniform rule on the Field Boundaries layer, try Hatch and Cross hatch, and confirm rendering in Preview.
