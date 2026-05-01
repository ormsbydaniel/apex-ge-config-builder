## Goal

Reduce visual noise in the vector style editor. By default, every property assumes a **Constant** value and shows just its inline editor (e.g. `Color`, `Width`). The "Constant / By attribute / By zoom / Expression" mode dropdown is hidden until the user explicitly switches that property into Advanced mode.

## Current state

In `ValueInput.tsx`, every property row renders:

```text
[ Label ........... ] [ Mode dropdown ▼ ]
[ inline editor ................. ]
```

So `Line` shows two dropdowns (Color mode, Width mode) and `Fill` shows one — even though 95% of users will only ever set a constant.

## Proposed UI

Default (clean) row:

```text
Color   [#3b82f6  ▢]      [⋯]
Width   [    2     ]      [⋯]
```

The `[⋯]` is a small ghost icon button (e.g. `Settings2` or `MoreHorizontal`) at the right of the row. Clicking it reveals the mode dropdown and any associated editor (attribute picker, stops, expression textarea). Clicking again collapses back. If the property is currently in any non-constant mode, the row is treated as "advanced open" automatically and the icon shows an active state.

Resetting to constant: when collapsing an advanced row that's still on a non-constant mode, leave the value as-is (don't silently destroy work). Provide a small "Reset to constant" link inside the expanded panel for an explicit revert.

## Changes

### `src/components/vectorStyle/ValueInput.tsx`

- Add `useState<boolean>(false)` for `advancedOpen`, defaulting to `mode !== 'constant'` via `useState(() => modeOf(value) !== 'constant')`.
- Always render the inline constant editor when `mode === 'constant'`, regardless of `advancedOpen`.
- Hide the mode `<Select>` unless `advancedOpen` is true.
- Add a small trailing icon button (`variant="ghost" size="icon" className="h-7 w-7"`) using `lucide-react`'s `Settings2` icon, with `aria-label="Advanced value options"` and a tooltip "Advanced". When the row is in a non-constant mode, give it an active visual treatment (e.g. `text-primary`).
- When `advancedOpen` is true, render the existing mode-specific blocks (attribute, zoom, expression). When false and `mode !== 'constant'`, still render a compact summary line ("By attribute: name", "By zoom", "Expression") so users don't lose sight of what's configured, with the icon acting as the way to expand.
- Inside the advanced panel, add a small "Reset to constant" button that calls `onChange({ kind: 'constant', value: defaultConstantFor(prop.type) })` and sets `advancedOpen` back to false.

### Layout impact on `PropertyForm.tsx`

No structural changes required — the 2-column grid already exists. The new compact row will look like:

```text
[ Label ] [ inline value editor ........... ] [⋯]
```

So switch the row layout in `ValueInput.tsx` from `space-y-2` with separate label/select rows to a single flex row when `mode === 'constant' && !advancedOpen`:

```text
<div className="flex items-center gap-2">
  <Label className="text-xs w-20 shrink-0">{prop.label}</Label>
  <div className="flex-1"><ConstantInput .../></div>
  <AdvancedToggleButton ... />
</div>
```

When advanced is open (or mode is non-constant), fall back to the existing stacked layout with the mode select visible.

### No changes required

- `propertyCatalogues.ts` — property defs unchanged.
- `ConstantInput.tsx` — already renders the right inline editor per type.
- `SimplePanels.tsx`, `MarkerPanel.tsx`, `StyleRuleCard.tsx`, serialisation utilities — unaffected.
- `ValueModel` type — unchanged. Defaults already produce `kind: 'constant'`.

## Acceptance criteria

- Opening the vector styling dialog on a fresh rule shows `Line: Color | Width`, `Fill: Color`, etc. with no mode dropdowns visible.
- Each row has a discreet trailing icon that, when clicked, reveals the mode `<Select>` and any related editor.
- A property already configured as `By attribute` / `By zoom` / `Expression` opens with the advanced panel expanded so nothing appears hidden.
- Toggling advanced off after picking a non-constant mode keeps the data intact; "Reset to constant" provides an explicit revert.
- Existing serialisation round-trips still pass (no behaviour change to the underlying model).
