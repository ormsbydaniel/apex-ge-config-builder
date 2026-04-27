## Goal

Make the X-Axis and Y-Axis settings clearer by labelling each row (Axis, Ticks, Grid) and giving each input a visible inline label. Allow the Ticks section to wrap onto two rows so controls don't get squashed.

## New layout (per axis)

```text
X-Axis
  Axis    Label: [______________]   Size: [__]
  Ticks   Format: [dropdown]            Suffix: [__]
          Size: [__]   Orientation: [slider __°]
  Grid    (toggle)   Type: [Auto/Date/Linear/Category]
```

Y-Axis is the same, minus Orientation (Y has no tickangle control today, keeping parity):

```text
Y-Axis
  Axis    Label: [______________]   Size: [__]
  Ticks   Format: [dropdown]   Suffix: [__]
          Size: [__]
  Grid    (toggle)
```

## Changes

**File: `src/components/charts/ChartSettingsPanel.tsx`**

- Replace the current 5-column grid with a 3-column grid: X-Axis | Y-Axis | Legend, separated by vertical dividers.
- For each axis, render labelled rows. Each row starts with a fixed-width (~3.5rem) muted "Axis" / "Ticks" / "Grid" label, followed by inline `<Label>` + control pairs with `gap-2`.
  1. **Axis row** — `Label:` text input (flex-1) + `Size:` numeric input (w-14). Bound to `xaxis.title.text` and `xaxis.title.font.size`.
  2. **Ticks (line 1)** — `Format:` dropdown (flex-1) + `Suffix:` text input (w-20). Bound to `xaxis.tickformat` and `xaxis.ticksuffix`.
  3. **Ticks (line 2)** — `Size:` numeric input (w-14) + (X-axis only) `Orientation:` slider with degree readout (flex-1). Bound to `xaxis.tickfont.size` and `xaxis.tickangle`.
     - The two Ticks lines share the "Ticks" row label (label spans only the first line; the second line is indented to align under the controls).
  4. **Grid row** — show/hide Switch + (X-axis only) `Type:` dropdown for Auto/Date/Linear/Category.
- Preserve all existing handlers and bindings (`updateXAxisTitle`, `updateXAxisTickFont`, `tickformat`, `ticksuffix`, `tickangle`, `showgrid`, `type`, etc.). No schema/type changes.
- Keep the Legend column exactly as it is today.

## Out of scope

- No changes to JSON schema, types, or the Plotly viewer.
- No new fields — only re-organising existing controls and adding visible labels.
