# Fix: Vector Style Summary shows blank grey swatch

## Root cause

`vectorItem.style` in the layer config is stored as the **OpenLayers flat-style array** (e.g. `[{ "stroke-color": "#3b82f6", "stroke-width": 2 }]`), not the editor's normalised `StyleRule[]` model.

`summariseStyleRule` expects the normalised shape with `rule.primitives.{fill,line,marker,label}`. Given a raw flat rule:

- `collectPrimitiveKinds({})` returns `[]`
- `dominantKind` is `undefined`
- `SwatchGlyph` falls through to the "no kind" branch — a plain grey rounded square
- Tooltip shows only `name` + `applies to all features` (no primitives row, no colour info)

This matches exactly what the user is seeing.

The codebase already has the right converter: `fromFlatStyleArray` in `src/utils/vectorStyle/fromFlatStyleArray.ts`, which returns `{ rules: StyleRule[], ... }`. The same conversion is what the Vector Style editor uses when opening a rule set.

## Change

**`src/components/layers/components/VectorStyleSummary.tsx`** — accept the raw flat array (typed as `unknown[]`) and normalise internally:

1. Call `fromFlatStyleArray(rules)` to get `{ rules: StyleRule[] }`.
2. Pass those normalised rules to `summariseRules`.
3. Render exactly as today.

Update the prop type from `StyleRule[]` to `unknown[]` (or `any[]`) and rename to `flatStyle` for clarity. Keep the empty/None handling.

No change needed in `LayerDataVisualisationSection.tsx` beyond what's already there — it already passes `vectorItem?.style ?? []`.

## Tests

Add one extra test (or a new tiny test file alongside `VectorStyleSummary`) that feeds the flat-style example from the user and asserts:

- `summariseRules(fromFlatStyleArray([{ 'stroke-color': '#3b82f6', 'stroke-width': 2 }]).rules)` yields a single summary with `dominantKind === 'line'` and `colour === '#3b82f6'`.

Existing `summariseStyleRule` tests stay as-is (they exercise the normalised model directly, which is still valid).

## Out of scope

- No schema, type, or persistence changes.
- No edits to the rule editor or normaliser.
- Pencil edit button untouched.
