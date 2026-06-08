## Goal

Replace the bare `(N rules)` summary in the Vector Styling row of the layer card's Data Visualisation section with a compact swatch strip that conveys, at a glance, what each rule does.

## Visual shape

Inline, on the same line as the "Vector Styling" label and the edit pencil:

```text
Vector Styling  ■ ━ ● ▦  +2 more   [✎]
```

- Up to **4 swatches** rendered, one per rule, in rule order.
- If more than 4 rules exist, append a muted `+N more` chip.
- Each swatch is ~14×14 px, rounded, bordered, aligned to the row baseline.
- A glyph indicates the dominant primitive for the rule:
  - `fill` → filled square in the rule's fill colour
  - `line` → thick horizontal bar in the rule's stroke colour
  - `marker` → filled circle in the marker colour (icon submode shows a generic dot)
  - `label` → uppercase `T` glyph in the label's text colour
- When the relevant paint property is **data-driven** (attribute/zoom/expression `ValueModel`), the swatch shows a small diagonal-stripe pattern in muted tones instead of a solid colour, signalling "varies".
- Disabled rules render at 40% opacity.
- Each swatch has a tooltip (using existing `Tooltip` primitives + project's 400ms delay rule) with:
  - Rule name (or `Rule {index+1}`)
  - Primitive kinds present (`fill`, `line`, `marker`, `label`)
  - Filter summary (e.g. `where status = 'open'`, `else`, or `always`)
  - `Data-driven by {field}` when applicable
- `+N more` tooltip lists the truncated rule names.
- When `style` is empty/absent, keep the existing `(None)` text.

## Files to add

### 1. `src/utils/vectorStyle/summariseStyleRule.ts`

Pure helper: given a `StyleRule`, returns a structured `RuleSummary`:

```ts
interface RuleSummary {
  name: string;                              // resolved display name
  enabled: boolean;
  primitiveKinds: Array<'fill'|'line'|'marker'|'label'>;
  dominantKind: 'fill'|'line'|'marker'|'label';   // for the swatch glyph
  colour: string | 'data-driven' | undefined;     // resolved paint colour
  drivingField?: string;                          // first attribute field found
  filterText: string;                             // 'always' | 'else' | human-readable
}
```

Plus `summariseRules(rules: StyleRule[]): RuleSummary[]`.

Dominance order when multiple primitives are present: `fill > line > marker > label` (matches visual hierarchy on the map).

Paint property used to pick the colour per dominant kind:
- `fill` → `fill-color`
- `line` → `stroke-color`
- `marker` → `circle-fill-color` / `icon-color` / `shape-fill-color` (first found)
- `label` → `text-fill-color`

If that `ValueModel` is `constant`, use the value. Otherwise return `'data-driven'` and capture the field name from the value model (or from the first attribute-driven prop) for the tooltip.

Filter text formatter:
- `rule.else` → `'else'`
- no filter → `'always'`
- `simple` filter → join clauses with the combinator, formatting each as `{field} {op} {value}` (arrays joined with commas, truncated past 3 values)
- `expression` filter → `'custom expression'`

### 2. `src/utils/vectorStyle/__tests__/summariseStyleRule.test.ts`

Unit tests covering:
- Constant fill colour
- Attribute-driven `match` fill (returns `data-driven` + field)
- Zoom-driven stroke
- Multiple primitives → correct dominance
- Marker submodes (circle / icon / shape)
- `else` rule
- Simple `all` / `any` filter formatting
- Empty rules array

### 3. `src/components/layers/components/VectorStyleSummary.tsx`

Presentational component:

```tsx
<VectorStyleSummary rules={vectorItem.style} />
```

- Computes summaries via `summariseRules`.
- Renders the inline swatch strip + optional `+N more` chip + tooltips.
- Falls back to `(None)` text when `rules.length === 0`.
- Uses semantic tokens only (`bg-muted`, `border-border`, `text-muted-foreground`, etc.) — colour fills come from the rule data so use inline `style={{ backgroundColor }}` for those swatches; data-driven swatches use a Tailwind-only striped pattern via `bg-[repeating-linear-gradient(...)]` with `hsl(var(--muted-foreground))`.

### 4. Edit `src/components/layers/components/LayerDataVisualisationSection.tsx`

Replace the inline IIFE at lines 306–311 that renders `({vectorItem.style.length} rule…)` with `<VectorStyleSummary rules={vectorItem?.style ?? []} />`, preserving the existing label, italic styling, and `min-w-[175px]` alignment.

No other behaviour or layout in this file changes. The edit pencil button (lines 313–325) stays exactly as-is.

## Out of scope

- Editing rules from the card (the pencil button still opens the existing dialog).
- Reordering, enabling/disabling rules from the card.
- A hover popover with full per-rule detail (Option D) — can be layered on later if needed.
- Schema, type, or persistence changes — this is a pure read-side rendering improvement of existing `StyleRule[]` data.

## Adherence to project guidelines

- Schema/types untouched; no Zod/TS/validation drift risk.
- New code is a small focused util (`summariseStyleRule.ts`) plus one presentational component — no refactor of the surrounding hook or `LayerDataVisualisationSection.tsx` beyond the single-line swap.
- No logging added (per "Logging" guideline — nothing in a hot render loop).
