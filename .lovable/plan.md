# Vector Styling Revamp — Two-Pane Rule Manager + Intent-First Recipes

The user picked rendered wireframes for both directions:
- Proposal 2 (two-pane rule manager): wireframe v1 — "Two-pane rule manager"
- Proposal 3 (intent-first recipes): wireframe v1 — "Recipe selection" entry screen

They are complementary: the recipe screen is the dialog's entry state; picking a recipe
scaffolds a rule and lands in the two-pane editor to refine it.

## Phase 1 — Two-pane rule editor (core)

Replace the vertical stack of collapsible `StyleRuleCard`s in `VectorStylingDialog.tsx`
with a two-pane layout inside the existing dialog (widen from max-w-3xl to ~max-w-5xl):

- Left pane (~1/3): compact rule list — one row per rule: drag handle, name,
  filter summary (small mono text, e.g. `CONTINENT = Europe`), primitive swatches,
  visibility eye, up/down reorder; plus "Add rule". Selected rule highlighted.
  Mirrors the Manage Fields table pattern (FieldItem rows).
- Right pane (~2/3): selected-rule editor with the existing Marker / Line / Fill /
  Label / When tabs. Inside a tab, property rows keep the current inputs
  (ConstantInput, StopsEditor, FilterBuilder unchanged) but:
  - value-mode dropdown (Constant / From field / By zoom / Expression) is always
    visible — no chevron; collapsed italic summaries disappear;
  - an "Add property" picker lists catalogued properties not yet set for that
    primitive (dash pattern, line cap/join, miter limit, label placement/offsets,
    icon anchor/tint, shape inner radius) so they are reachable without the JSON editor.
- When tab: FilterBuilder moves into the tab as today; an else-branch section stays.
- State: keep the existing flat style array model, `toFlatStyleArray` /
  `fromFlatStyleArray`, mode toggle and Save/Cancel/{JSON} icon behaviour exactly
  as-is; only the presentation layer changes.

Files: `src/components/layers/components/VectorStylingDialog.tsx` (layout + selection
state), new `src/components/vectorStyle/RuleListPane.tsx` and
`src/components/vectorStyle/RuleEditorPane.tsx`, reuse `ValueInput.tsx`,
`FilterBuilder.tsx`, `StopsEditor.tsx`, `SimplePanels.tsx`, and the property
catalogue from `src/utils/vectorStyle/defaults.ts` (extend with the missing
advanced properties if not already catalogued).

## Phase 2 — Intent-first recipe entry

When the layer has no style yet, the dialog opens on a recipe screen instead of an
empty rule list ("What would you like to style?"):

- Goal cards: Colour features by an attribute, Size symbols by a value,
  Label features, Show only matching features, Style everything the same,
  plus "Start from scratch" link.
- Picking a goal opens a compact scaffold form (choose field — from configured
  `meta.fields` or auto-detected; choose palette/classification; label field;
  filter field/op/value as appropriate) and writes the matching entries into the
  flat style array (field-driven colour via match/interpolate stops, sized markers
  via zoom/attribute stops, label primitive, filter in When).
- The user then lands in the Phase 1 two-pane editor to refine.
- "Start from scratch" skips straight to the editor. Existing styles open the
  editor directly (recipe screen only for empty styles); recipes never create a
  second persistence format — they only seed the existing style array.

Files: new `src/components/vectorStyle/RecipeEntry.tsx` +
`src/components/vectorStyle/RecipeScaffold.tsx`; a
`src/utils/vectorStyle/recipes.ts` module that builds style-array entries per goal;
`VectorStylingDialog.tsx` routes between recipe screen and editor.

## Docs

- Update `docs/layers/vector-styling` coverage (the Data Visualisation docs page)
  with the new dialog: recipe entry, two-pane editor, add-property picker —
  house style, 4-space indentation, new screenshots via `scripts/add-screenshot.sh`.
- Rebuild the guide with `python3 -m mkdocs build --strict`.

## Verification

- Existing unit tests keep passing (`toFlatStyleArray`/`fromFlatStyleArray`
  round-trip untouched); add tests for `recipes.ts` scaffolding.
- Build clean; user does visual testing in the preview (no publishing).

## Notes

- Schema/types unchanged — visual + UX only, so no Zod/TS sync work.
- Per plan-mode constraints, `roadmap.md` could not be updated this turn; fold the
  two phases into it when implementation starts.
