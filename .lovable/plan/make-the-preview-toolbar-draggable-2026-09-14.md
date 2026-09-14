# Make the preview toolbar draggable

Let the user drag the floating toolbar on the Preview page anywhere over the preview window, so it stops obscuring content they need to see.

## What changes

**`src/pages/Preview.tsx`** — the only file touched:

1. **Position state** — replace the fixed `absolute top-[3px] left-1/2 -translate-x-1/2 translate-x-[5%] translate-y-[150%]` placement with a `{ x, y }` position kept in React state, initialised to the current default spot (top centre, nudged right and down as today).

2. **Drag behaviour** — pointer-event based dragging (no new dependencies):
   - A dedicated drag handle (grip icon, `GripVertical` from lucide) at the left of the toolbar with a `cursor-grab` / `cursor-grabbing` affordance, so buttons and the version dropdown keep working normally.
   - On pointer down on the handle: capture the pointer, track movement, update `{ x, y }` as the pointer moves; on pointer up: end the drag.
   - Clamp the position so the toolbar always stays fully inside the preview window (a few pixels margin from each edge).

3. **Remember the position** — persist the last dropped position to `localStorage` (e.g. `preview-toolbar-position`) and restore it on load, so a user's chosen spot survives page reloads.

## Out of scope

- No changes to the toolbar's contents (buttons, version selector, badges).
- No snapping, edge-docking or multi-monitor handling — free positioning only.

## Verification

- Build/typecheck passes.
- Playwright check on `/preview`: drag the handle, confirm the toolbar follows and stays within the window, reload and confirm the position persists.
