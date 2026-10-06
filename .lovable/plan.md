# Balance the vector styling rule editor layout

## Goal
Make the two-pane rule editor feel less dense: give the rules list a bit more width, take a little from the rule details pane, and add internal padding inside each rule card so the name, swatches and scope text aren't cramped against the card edge. Adjustments of roughly 5–10 px, no behaviour changes.

## Changes

### 1. Two-pane split — `src/components/vectorStyle/StyleEditor.tsx`
Current grid (line 116): `md:grid-cols-[minmax(220px,30%)_minmax(0,1fr)]`

- Widen the left (rules) column: `minmax(220px,30%)` → `minmax(240px,34%)`.
- The right pane stays `minmax(0,1fr)`, so it narrows by the same amount.
- Keep `gap-3` and the existing border/padding between panes unchanged.

### 2. Rule card padding — `src/components/vectorStyle/RuleListPane.tsx`
Current rule card classes: `... rounded-md border px-1 py-1 text-xs`

- Change to `px-2.5 py-1.5` so the rule name, glyphs, colour swatches, filter summary and the copy/trash buttons all get ~5–6 px more breathing room inside the card.

## Verification
- Run the vector styling test suite (`StyleEditor.test.tsx` and related) plus typecheck.
- Playwright check against the multispectral/vector test config: open Vector Styling on a layer, screenshot the dialog, confirm the rules column is wider, the details pane narrower, and card padding looks balanced at the dialog's default width.

## Out of scope
No schema, save, reordering, or rule-editor logic changes.
