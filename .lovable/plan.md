## Inline the constant value next to the mode dropdown

When a user clicks `»` on a property row, today the expanded view stacks:

```text
[ Color                       Constant ▾   » ]
[ #3b82f6 ▢ ]
```

It should compact to a single line for the constant case, then only expand vertically when a non-constant mode is chosen:

```text
Constant (default after »):
[ Color   Constant ▾   #3b82f6 ▢   « ]

After picking another mode (e.g. By attribute):
[ Color   By attribute (match) ▾   « ]
[ ┌─────────────────────────────────┐ ]
[ │ Attribute  [name ▾]             │ ]
[ │ When equals ... → Use ...       │ ]
[ │ Default     [#3b82f6]           │ ]
[ └─────────────────────────────────┘ ]
```

### Change

`src/components/vectorStyle/ValueInput.tsx` — in the expanded (`!compact`) branch:

- Header row becomes: **Label · Mode dropdown · (constant value if mode === constant) · spacer · chevron toggle**.
  - Label: fixed `w-20 shrink-0` (matches the collapsed compact row).
  - Mode select: fixed `w-[180px] shrink-0`.
  - When `mode === 'constant'`, render the `ConstantInput` inline inside a `flex-1 min-w-0` wrapper so it consumes the remaining width.
  - When `mode !== 'constant'`, render an empty `flex-1` spacer to push the chevron to the right.
- Remove the standalone block that previously rendered `ConstantInput` on its own line beneath the header (now redundant).
- Sub-editors for `attribute-match`, `attribute-interp`, `zoom`, `expression` continue to render as full-width blocks below the header — unchanged.
- Tooltip / chevron behaviour and "Reset to constant" footer remain as-is.

No other files are affected.
