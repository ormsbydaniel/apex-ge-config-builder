## Show constraint names in Apply-constraints summary card

In `ActionsAndLayersSection.tsx` (~line 343-352), the summary for each `layerControl` action currently shows the layer name plus a count like `2 constraints`. Change it to list the constraint labels by name.

### Change

- Replace the `${n} constraint(s)` bit with the joined list of `c.constraints[].label` values.
- Keep the existing separators (`layer · opacity … · blend · <constraint names>`).
- If a constraint has no label, fall back to a placeholder (`unnamed`).
- If the list is long (>3), show the first 3 followed by `+N more` to keep the card compact.
- Layer name and opacity/blend bits stay unchanged. No schema, type, or editor changes.

### Example
Before: `wind energy · 2 constraints`
After:  `wind energy · elevation · land cover`
Long:   `wind energy · elevation · land cover · slope +2 more`
