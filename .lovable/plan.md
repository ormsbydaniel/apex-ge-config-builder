## Goal

Build a structured (non-JSON) editor for the vector style array that maps to the OpenLayers flat-style spec. JSON mode is preserved and round-trips. Live preview is deferred.

## Locked decisions

1. Editor-only rule **name** is persisted as `_name` in the JSON output (harmless extension key, survives JSON-mode round-trips).
2. Filter operators v1: `=`, `!=`, `<`, `<=`, `>`, `>=`, `in`, `not in`, `has`. Combined with `All` / `Any`. Also a special pseudo-field "Zoom".
3. Adding a primitive applies **sensible OL defaults** (e.g. Marker → circle radius 5, fill `#3b82f6`, stroke `#ffffff` width 1; Line → stroke `#3b82f6` width 2; Fill → `#3b82f6` at 0.4 opacity; Label → `text-value` bound to first detected string field, white fill with grey halo).

## Data model

Each entry of the saved array follows OL's rule shape:

```js
{ filter?: <expression>, else?: true, style: { /* flat properties */ } }
```

Editor-side model:

```ts
StyleRule = {
  name?: string;               // serialised as _name
  enabled?: boolean;           // disabled rules omitted from output
  filter?: FilterModel;
  else?: boolean;
  primitives: { marker?, line?, fill?, label? };
}

ValueModel =
  | { kind: 'constant', value: string | number | boolean | number[] }
  | { kind: 'attribute', field: string, mode: 'match' | 'interpolate', stops?, default? }
  | { kind: 'zoom', mode: 'interpolate', interpolation?: 'linear' | ['exponential', n], stops }
  | { kind: 'expression', raw: any }

FilterModel =
  | { kind: 'simple', combinator: 'all' | 'any', clauses: Clause[] }
  | { kind: 'expression', raw: any }
```

## UI structure

```text
Style Set (the array)
└── Style Rule card  (drag to reorder = paint order)
    ├── Header  (name • primitive chips • enable/duplicate/delete/drag)
    ├── When    (simple filter rows or "Else", or fallback expression)
    └── Drawing layers (Marker / Line / Fill / Label panels — only enabled ones)
        └── Property → reusable ValueInput (Constant | By attribute | By zoom | Expression)
```

- **Primitive chips** (`● Marker  ─ Line  ▢ Fill  A Label`) toggle the existence of each panel and its property group in `style`.
- **Marker panel** has a Circle / Icon / Shape sub-mode mapping to `circle-*` / `icon-*` / `shape-*`.
- **Filter builder**: rows of `field op value`; "Zoom" pseudo-field emits `['zoom']`. Compiles to `['all', …]` / `['any', …]`. Fallback "Expression" mode round-trips anything the simple builder can't represent.
- **ValueInput**: dropdown chooses mode per property; right-hand editor adapts to the property's expected type (color picker, number, font, etc.).
- **Empty state**: four big buttons (`Add markers`, `Add lines`, `Add fills`, `Add labels`) each create a rule with one primitive and the defaults above.

## Round-tripping with JSON mode

- Toggling to JSON serialises the structured model with `toFlatStyleArray`.
- Toggling back parses with `fromFlatStyleArray`; anything unmappable falls into "Expression" mode for that property or rule, with a small banner: *"N item(s) opened in expression mode"*. No data loss either way.

## Phased implementation

**Phase 1 — Model + serialisation (no UI changes)**
- `src/types/vectorStyle.ts`
- `src/utils/vectorStyle/{toFlatStyleArray.ts, fromFlatStyleArray.ts, propertyCatalogues.ts, filterCompiler.ts, defaults.ts}`
- Vitest round-trip tests for: single rule, multi-rule with `else`, `interpolate` on `['zoom']`, `['get', field]` on color, label `concat`, unknown expression fallback.

**Phase 2 — Reusable `ValueInput`**
- `src/components/vectorStyle/ValueInput.tsx` plus `AttributeExpressionEditor`, `ZoomExpressionEditor`, `ExpressionFallbackEditor`.
- Uses detected vector fields (per existing Vector Fields Editor) for attribute pickers.

**Phase 3 — `FilterBuilder`**
- Simple/expression toggle, `All`/`Any`, clause rows with the v1 operator set, "Else" toggle.

**Phase 4 — Drawing-layer panels**
- `MarkerPanel` (Circle/Icon/Shape sub-mode), `LinePanel`, `FillPanel`, `LabelPanel`. Each driven by its property catalogue with a "More options" disclosure for advanced props.

**Phase 5 — `StyleRuleCard` + `StyleEditor`**
- Card with primitive chips, drag-reorder, duplicate/delete, collapsed summary line (`Cities • ● A • when pop_max > 10M`).
- List with `+ Add rule` menu (Marker / Line / Fill / Label / Blank).

**Phase 6 — Wire into `VectorStylingDialog`**
- Replace the basic-mode placeholder with `<StyleEditor />`.
- JSON↔structured toggle uses the serialisers; show the fallback-banner when applicable.
- Save handler unchanged (writes to all vector data sources via existing logic).

## Out of scope (this iteration)

- Live preview (will revisit; OL canvas with sample point/line/polygon is the likely path).
- WebGL-only style validation hints.
- MapLibre/Mapbox import.
- Style presets / template library.
- `between`, `starts with`, `regex` filter operators (can be added later without model changes).

## Files added / edited

Added:
- `src/types/vectorStyle.ts`
- `src/utils/vectorStyle/{toFlatStyleArray, fromFlatStyleArray, propertyCatalogues, filterCompiler, defaults}.ts`
- `src/components/vectorStyle/{StyleEditor, StyleRuleCard, FilterBuilder, ValueInput, MarkerPanel, LinePanel, FillPanel, LabelPanel, AttributeExpressionEditor, ZoomExpressionEditor, ExpressionFallbackEditor}.tsx`
- Tests under `src/utils/vectorStyle/__tests__/`

Edited:
- `src/components/layers/components/VectorStylingDialog.tsx`

## Suggested first PR

Phases 1 + 2 only — model, serialisers (with tests), and the `ValueInput`. Nothing user-visible changes yet, but it gives us a tested foundation and lets later phases be small, focused PRs.
