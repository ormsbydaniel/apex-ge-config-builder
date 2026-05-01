## Stack property rows vertically (one per row)

Currently `PropertyForm` lays out property inputs in a 2-column responsive grid, so for a Line panel the user sees Color and Width side-by-side. The compact constant view inside `ValueInput` already renders as `Label | input | PlusCircle`, so switching the form container to a single vertical stack will give the requested layout:

```text
Line
  Color    [#3b82f6 ▢]    ⊕
  Width    [    2     ]   ⊕
```

### Change

- `src/components/vectorStyle/PropertyForm.tsx`: replace the `grid grid-cols-1 md:grid-cols-2 gap-3` wrapper with a `space-y-2` vertical stack so each property occupies its own row at all viewport widths.

This applies uniformly to Line, Fill, and Label panels (Marker uses the same `PropertyForm` under `MarkerPanel`).

No changes are required in `ValueInput` — its compact constant row already renders as Label | input | PlusCircle which matches the requested per-row format.
