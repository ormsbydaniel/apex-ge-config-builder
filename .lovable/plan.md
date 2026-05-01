## Goal

Treat the rule's "When" (filter) section the same way as drawing primitives: a chip in the primitive row that toggles whether the panel is shown.

## Changes (single file: `src/components/vectorStyle/StyleRuleCard.tsx`)

1. **Add a "When" chip** at the end of the primitive chip row, right of "Label". Use the lucide `Filter` icon as its glyph to visually distinguish it from drawing primitives (Marker/Line/Fill/Label).

2. **Track expansion with a derived + local state pair:**
   - Local `useState<boolean>` initialised from a derived "has meaningful filter" check (`rule.else === true`, or `filter.kind === 'simple'` with clauses, or `filter.kind === 'expression'`).
   - This ensures rules loaded from existing JSON with a filter automatically show their When panel expanded.

3. **Toggle behaviour:**
   - Off → On: just reveal the panel; do not mutate rule state.
   - On → Off: hide the panel AND clear `rule.filter` and `rule.else` so the rule becomes unconditional. Skip the clear if the filter is already empty.

4. **Conditional render of the When panel:**
   - Only render the existing `<FilterBuilder>` section when the chip is "active".
   - Wrap it in the shared `PanelSection` component (`title="When"`) for visual consistency with Marker/Line/Fill/Label panels — currently it uses a slightly different inline `<Label>` styling.

5. **Collapsed-card summary:** no change — `summary()` already mentions "when N conditions / else / custom filter" when applicable.

## Visual outcome

Chip row becomes:

```text
[● Marker] [─ Line] [▢ Fill] [A Label]   |   [⛛ When]
```

Optionally separate the When chip with a thin divider or extra `ml-auto`/spacing so it reads as a different category. Active = filled (`variant="default"`), inactive = outline — identical to the other chips.

## Out of scope

- No changes to data model, serialisation utilities, FilterBuilder internals, or other components.
- No new memory entries needed.
