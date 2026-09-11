# Fix: only one base layer should stay active

## Root cause (confirmed)

When you tick **Display on Load** on a base layer and confirm the
"Replace Active Base Layer?" warning, the form saves through
`useLayerOperations.updateLayer()`, which dispatches the **bulk**
`UPDATE_SOURCES` action. The reducer's single-layer enforcement ("deactivate all
other active base layers") only exists in the `ADD_SOURCE` and `UPDATE_SOURCE`
(singular) cases in `src/contexts/ConfigContext.tsx` (lines ~462–498) — the
`UPDATE_SOURCES` case (line ~509) only sanitizes URLs and never deactivates the
previously active base layer. Result: both layers keep `"isActive": true`.

The same gap affects the inline **Active by default** toggle on the layer card
(`UnifiedBasicInfoSection` → `onUpdateLayer` → `UPDATE_SOURCES`).

## Fix

In the `UPDATE_SOURCES` case of the config reducer
(`src/contexts/ConfigContext.tsx`), after the existing sanitization, add the
same single-active-base-layer rule, applied by diffing against current state:

1. Find base layers that are newly activated in the payload
   (`isBaseLayer && isActive` in the payload, but not active at the same index
   in current state).
2. If at least one exists, set `isActive: false` on every *other* active base
   layer, keeping the newly activated one active.
3. Pure reorders/moves don't newly activate anything, so they are unaffected —
   this only fires when activation actually changes, exactly matching the
   warning dialog's promise.

This keeps the change in one place (the reducer) and covers both the
BaseLayerForm save path and the layer-card inline toggle, without touching
`updateLayer`'s contract or any UI.

## Verification

- Manual check in the preview: activate base layer A, then activate base layer B
  (confirm the warning) → exported JSON has `isActive: true` only on B; the
  inline card toggle behaves the same.
- Existing Vitest suite stays green.
