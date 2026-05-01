## Two-column grid: simple rows take 1 col, advanced spans 2

Today every property row is full-width. Simple constant rows (e.g. Line → Color, Width) only need a label + a small input + the ⊕ toggle, leaving lots of empty space on the right. When the user expands a row into advanced mode (attribute / zoom / expression / stops editor) the extra width becomes useful.

### Behaviour

- The panel becomes a responsive **2-column grid**.
- A row whose value is **constant and not expanded** occupies **one column**.
- A row that is in **advanced mode or whose advanced panel is open** spans **both columns** so the attribute picker, stops editor, expression textarea, etc. get the full width.
- On narrow viewports (`< md`) it falls back to a single column for both states.

```text
md+ viewport:
  [ Color  #3b82f6 ⊕ ] [ Width  2  ⊕ ]
  [ Opacity ────────────────────── ⊕ ]   ← spans 2 because advanced is open
  [ By attribute (match): name             ... ]
```

### Changes

1. `src/components/vectorStyle/ValueInput.tsx`
   - Wrap the component's returned root in a div whose className includes `md:col-span-2` when `showAdvanced` (i.e. `advancedOpen || isAdvancedMode`) is true. Constant + collapsed rows render with no col-span class so they sit in a single grid cell.

2. `src/components/vectorStyle/PropertyForm.tsx`
   - Replace the `space-y-2` stack with `grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2`.

No other panels/components are affected — `PropertyForm` is used by `LinePanel`, `FillPanel`, `LabelPanel`, and `MarkerPanel` so all four benefit.
