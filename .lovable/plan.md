# Custom bounding box for Zoom to Center

## Goal
In the Edit Controls modal, keep the existing "Zoom to Center" toggle, and add a "Custom" affordance next to it that reveals four inputs (xmin, ymin, xmax, ymax). When a custom extent is set, persist it as an object with an `extent` array, e.g.:

```json
"zoomToCenter": { "extent": [0.0, 52, 1.0, 53.0] }
```

When only the toggle is on (no custom extent), persist as `true` (current behaviour).

## Schema status
The schema does **not** currently support this. Today:

```ts
zoomToCenter: z.boolean().optional()
```

Per project guideline #2, the Zod schema, the TypeScript interface, and the validation hook must all be updated together.

## Changes

### 1. Schema (`src/schemas/configSchema.ts`)
Widen `zoomToCenter` inside `ControlsSchema`:

```ts
zoomToCenter: z.union([
  z.boolean(),
  z.object({
    extent: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  }),
]).optional()
```

### 2. Types
Update the matching TypeScript interface for `controls.zoomToCenter` to `boolean | { extent: [number, number, number, number] }`.

### 3. Validation hook (`src/hooks/useValidatedConfig.ts`)
Confirm nothing strips or normalizes `zoomToCenter`. If sanitization exists, allow the object form through unchanged.

### 4. UI — `src/components/form/ControlsEditorDialog.tsx`
- Keep the existing `Zoom to Center` checkbox.
- Add a small "Custom" link button to the right of the label.
- Clicking it toggles an inline panel (indented under the row) with four numeric inputs labelled `xmin`, `ymin`, `xmax`, `ymax`.
- Local state additions:
  - `customExtentOpen: boolean`
  - `extent: { xmin: string; ymin: string; xmax: string; ymax: string }`
- Initialize from existing value inside the `open`-watching `useEffect`:
  - If `zoomToCenter` is an object with `extent` → checkbox on, custom open, inputs populated.
  - If `zoomToCenter === true` → checkbox on, custom closed.
  - Else → both off.
- On save, decide `newControls.zoomToCenter`:
  - If custom is open AND all four inputs parse as finite numbers → `{ extent: [xmin, ymin, xmax, ymax] }`.
  - Else if checkbox is on → `true`.
  - Else → omit.
- If custom is open but any input is invalid, block save with an inline hint.

### 5. Pass-through check
Grep for other readers of `controls.zoomToCenter` (exporters, viewer-bound code). This configurator passes through to the GE viewer, so no behavioural change is required here — just confirm the object shape survives serialization round-trips (import, edit, export, preview).

## Out of scope
- CRS handling for the entered coordinates (assumed to match viewer CRS, as elsewhere).
- A map-pick UI for the bbox.
- Any change to other controls in the dialog.
