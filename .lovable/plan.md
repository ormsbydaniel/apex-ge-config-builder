# Custom bounding box for Zoom to Extent

## Goal
In the Edit Controls modal, keep the existing "Zoom to Center" toggle, and add a "custom" affordance next to it that reveals four inputs (xmin, ymin, xmax, ymax). When set, the value is persisted as a 4-number array instead of `true`.

## Schema status
The schema does **not** currently support this. Today:

```ts
zoomToCenter: z.boolean().optional()
```

It needs to be widened to accept either a boolean or a `[xmin, ymin, xmax, ymax]` tuple. Per project guideline #2, the Zod schema, the TypeScript interface, and the validation hook must all be updated together.

## Changes

### 1. Schema (`src/schemas/configSchema.ts`)
Widen `zoomToCenter` inside `ControlsSchema`:

```ts
zoomToCenter: z.union([
  z.boolean(),
  z.tuple([z.number(), z.number(), z.number(), z.number()]),
]).optional()
```

### 2. Types (`src/types/layer.ts` or wherever `controls.zoomToCenter` is typed)
Update the field to `boolean | [number, number, number, number]`.

### 3. Validation hook (`src/hooks/useValidatedConfig.ts`)
Verify nothing strips/normalizes `zoomToCenter`. If sanitization exists, allow the array form through unchanged.

### 4. UI — `src/components/form/ControlsEditorDialog.tsx`
- Keep the existing `Zoom to Center` checkbox.
- Add a small "Custom" link/button to the right of the label.
- Clicking it toggles open an inline panel (indented under the row) with four numeric inputs labelled `xmin`, `ymin`, `xmax`, `ymax`.
- Local state:
  - `zoomToCenter: boolean` (existing)
  - `customExtentOpen: boolean`
  - `extent: { xmin: string; ymin: string; xmax: string; ymax: string }`
- Initialize from existing value:
  - If `controls.zoomToCenter === true` → checkbox on, custom closed.
  - If `controls.zoomToCenter` is an array → checkbox on, custom open, inputs populated.
  - Else → both off.
- On save, decide what to write to `newControls.zoomToCenter`:
  - If custom is open AND all four inputs parse as finite numbers → array `[xmin, ymin, xmax, ymax]`.
  - Else if checkbox is on → `true`.
  - Else → omit.
- Light client-side validation: highlight inputs that aren't valid numbers; do not save invalid extent (fall back to boolean true with a tiny inline hint, or block save — pick block save for clarity).

### 5. Pass-through check
Quick grep for any other place that reads `controls.zoomToCenter` as a strict boolean (viewer-bound code, exporters). Just confirm they tolerate the array shape — this configurator is a pass-through to GE viewer, so no behavioural change is needed here, only that the array survives serialization.

## Out of scope
- Rendering the bbox on a mini-map.
- Reprojecting / CRS handling for the entered coordinates (assumed to match the viewer's CRS, same as everywhere else).
- Any change to other controls in the dialog.
