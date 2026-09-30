# Rule editor tab indicator: replace the black dot with a tick badge

## What changes

In the vector styling rule editor (right pane), the Fill / Line / Marker / Label / When tab bar currently marks "this primitive is set in this rule" with a small black dot to the right of the tab label. That dot is easy to mistake for the Marker glyph and reads as a status light.

Replace it with a small tick badge, using the approved prototype direction (v1 "Numeric property badges" visual style, tick content):

- A small circular badge (~14px) beside the tab label, tinted with the primary colour at low opacity (`bg-primary/10`, tick in `text-primary`) containing a `Check` icon.
- Shown only on tabs whose primitive has content for the selected rule (same `active` condition as today, including the filter for "When").
- The badge gets a tooltip ("Set in this rule") so its meaning is discoverable, and keeps an accessible label.
- Tabs with nothing set show no badge — unchanged.

## Files

- `src/components/vectorStyle/RuleEditorPane.tsx` — swap the dot span at the tab trigger (the `rounded-full bg-primary` dot, ~line 114) for the tick badge; add the `Check` icon import and a tooltip wrapper.

Nothing else changes: no schema, no other panes, no recipe flow.

## Verification

- Styling unit tests (`bunx vitest run src/components/vectorStyle`) still pass.
- Build clean; visual check in the preview by you (Oslo NO2 rule shows tick badges on Fill and Line only).
