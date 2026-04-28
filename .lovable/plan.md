
# Tweak Add Layer screen: rename card + add Cancel button

Two small follow-ups to the just-landed Import Layer Card change.

## Changes

In **`src/components/layer/LayerTypeSelector.tsx`** only:

1. **Rename the first card's title** from "Layer Card" to **"Add Layer Card"** so it visually parallels "Import Layer Card". Button label stays "Add Layer Card" (already matches).
2. **Add a Cancel button** in the top-right of the screen (next to the heading). Uses `ArrowLeft` icon + label "Cancel", `variant="outline"`, `size="sm"`. Calls a new optional prop `onCancel?: () => void`.
3. Wrap the existing heading block in a `flex items-start justify-between` container so the Cancel button sits opposite the title.

In **`src/components/layers/LayerFormContainer.tsx`**:

- Pass the existing `onCancel` prop (already received) through to `<LayerTypeSelector>` as `onCancel={onCancel}`. No new plumbing needed — `onCancel` is already wired from `LayerFormHandler` → `handleLayerFormCancel` in `LayersTabCore`, which already does the right teardown (closes form, clears selected type, clears default group).

## Notes

- No type, schema, or hook changes.
- `onCancel` is optional on `LayerTypeSelector` so any other caller (none today) keeps working.
- Cancel from this screen returns the user to the Layers page with no layer added — same behaviour as cancelling from the layer edit form.

## Verification

- Open Add Layer to \<group\> → title "Add Layer to …" still shown, **Cancel** button visible top-right.
- Click Cancel → returns to Layers page, no layer added.
- First card now reads "Add Layer Card" as the title; second card still reads "Import Layer Card".
- Add Layer Card and Import Layer Card buttons still work as before.
