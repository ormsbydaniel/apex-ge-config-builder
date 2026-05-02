## Indent progressive expansion under the value column

In `src/components/vectorStyle/ValueInput.tsx`, the property label (e.g. "Color", "Width") is `w-20` (5rem) followed by a `gap-2` (0.5rem). The expanded sub-panels (Method/Field/Stops editors) currently span the full width, making it ambiguous which property they belong to.

### Change

Wrap the expanded blocks (attribute panel, zoom panel, expression textarea, summary text, and reset button row) in a container with left padding equal to label-width + gap (`pl-[5.5rem]`) so they align under the value input column rather than under the label.

Affected blocks in `ValueInput.tsx`:
- Compact summary `<p>` (when collapsed but advanced)
- Attribute method/stops panel (`mode === 'attribute'`)
- Zoom stops panel (`mode === 'zoom'`)
- Expression textarea (`mode === 'expression'`)
- "Reset to constant" button row

### Result

```text
Line
  Color    [ From field ▾ ] [ NUTS_ID ▾ ] «
           ┌──────────────────────────┐
           │ Method [ Direct ▾ ]      │
           └──────────────────────────┘
  Width    [ 6 ]
```
