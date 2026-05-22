# Custom bounding box for Zoom to Center — Phase 2 UI Plan

Phase 1 (schema + pass-through) is complete. This plan covers the UI for setting a custom extent.

## Target schema shape (already supported)

```json
"zoomToCenter": { "extent": [0.0, 52, 1.0, 53.0] }
```

Existing boolean form (`"zoomToCenter": true`) continues to work.

---

## Phase 2 — UI

Goal: users can choose between "Zoom to layer bounds" (boolean true) and "Zoom to custom extent" (object with extent array) directly in the UI, without hand-editing JSON.

### 2.1 Behaviour

When the "Zoom to layer" / "Zoom to Center" switch is ON, a second row appears below it with two radio-style choices:

- **Layer bounds** (default) — writes `zoomToCenter: true`
- **Custom extent** — reveals a single text input for typing the extent as four comma-separated numbers (e.g. `0.0, 52, 1.0, 53.0`) and writes `zoomToCenter: { extent: [xmin, ymin, xmax, ymax] }`

If the switch is turned OFF, the sub-choice and input collapse and the field is removed from controls.

If the user switches from "Custom extent" back to "Layer bounds", the previously entered text is retained in local state so it is not lost if the user toggles back.

### 2.2 ControlsEditorDialog.tsx

This is the small inline dialog opened from the layer list for quick control edits.

Changes needed:

1. Add local state for `zoomToCenterMode: 'bounds' | 'custom'` and `zoomToCenterExtentText: string`.
2. On dialog open, inspect the existing `controls.zoomToCenter` value:
   - If `true` or missing/falsy → mode = 'bounds', switch ON.
   - If object with `extent` → mode = 'custom', switch ON, populate text input from `extent.join(', ')`.
   - If falsy → switch OFF.
3. Render the Zoom to Center checkbox as today. When checked, show an indented sub-row:
   - Two small buttons/pills or a segmented control: "Layer bounds" | "Custom extent"
   - If "Custom extent" selected, show a single text input with placeholder `xmin, ymin, xmax, ymax` and a small help label.
4. In `handleSave`:
   - If switch OFF → omit `zoomToCenter`.
   - If switch ON + mode 'bounds' → `zoomToCenter: true`.
   - If switch ON + mode 'custom' → parse the comma-separated text into four numbers. If parsing succeeds, write `zoomToCenter: { extent: [parsed] }`; otherwise fall back to `zoomToCenter: true`.
   - Preserve the existing fallback logic that keeps an already-stored object if the user merely leaves the switch on.

### 2.3 UnifiedControlsSection.tsx

This is the controls row in the main LayerCardForm (Create / Edit Layer Card).

Changes needed:

1. Accept a new prop `zoomToCenterExtent?: [number, number, number, number]`.
2. Add local state for `zoomToCenterMode: 'bounds' | 'custom'` and `zoomToCenterExtentText: string`.
3. When `zoomToCenter` switch is ON, show the sub-choice row below it (same pattern as ControlsEditorDialog).
4. On mode 'custom', render a single text input with placeholder `xmin, ymin, xmax, ymax`.
5. Call `onUpdate('zoomToCenterExtent', parsedArray)` when the text parses to four valid numbers; otherwise omit the update so the submission hook falls back to boolean true.
6. Call `onUpdate('zoomToCenter', true/false)` when the main switch changes.

### 2.4 LayerCardForm.tsx wiring

Pass `formData.zoomToCenterExtent` into `UnifiedControlsSection`.

### 2.5 useLayerCardFormState.ts

Already reads `zoomToCenterExtent` from `controlsObj.zoomToCenter.extent` (Phase 1). Verify it is correctly passed through to `LayerCardForm`.

### 2.6 useLayerCardFormSubmission.ts

Already reconstructs `{ extent: formData.zoomToCenterExtent }` when both `zoomToCenter` is true and `zoomToCenterExtent` is defined (Phase 1). No change needed.

### 2.7 useLayerCardFormPersistence.ts

Already reads and writes `zoomToCenterExtent` (Phase 1). No change needed.

### 2.8 LayerControlsSection.tsx (legacy)

Check if still mounted anywhere. If so, apply the same pattern as UnifiedControlsSection, or deprecate in favour of UnifiedControlsSection.

### 2.9 Input validation

- Parse the comma-separated text by splitting on commas and trimming whitespace.
- Exactly four values are required.
- Each value must parse to a valid finite number via `parseFloat`.
- If parsing fails (wrong count, non-numeric, NaN, Infinity) when mode is 'custom', treat the extent as undefined and fall back to `zoomToCenter: true` on save.
- No geographic validation (xmin < xmax etc.) — the viewer handles that.

### 2.10 Styling

Use the existing compact layout metrics (from project memory):
- Indent the sub-choice row with `ml-6` or equivalent.
- Use `h-8 text-sm` input to match the Download URL input pattern.
- Keep the input at a moderate width (`max-w-[280px]`) so it does not dominate the controls row.

---

## Out of scope

- No map pick / draw-bbox-on-map interaction.
- No CRS selector — extent is always in the map's default CRS (same as viewer behaviour).
- No changes to viewer bundle — it already consumes the object form from Phase 1.

---

## Acceptance criteria

1. Open Edit Controls on a layer with `zoomToCenter: true` — dialog shows switch ON, "Layer bounds" selected.
2. Hand-edit JSON to `zoomToCenter: { extent: [0,52,1,53] }`, reopen dialog — switch ON, "Custom extent" selected, input shows `0, 52, 1, 53`.
3. Change the text to new values, save, export config — JSON contains the new extent array.
4. In LayerCardForm, toggle "Zoom to layer" ON, choose "Custom extent", enter comma-separated values, create layer — resulting source has the object form.
5. Toggle switch OFF — `zoomToCenter` is removed from controls entirely.
6. Existing layers with plain `zoomToCenter: true` continue to work unchanged.
