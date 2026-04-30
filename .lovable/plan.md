## Goal
Stop the Healthcheck modal from resizing as content grows/shrinks. Pin it to a fixed height equal to the current maximum (`85vh`).

## Change
In `src/components/config/CompleteLayersDialog.tsx` (line 349), update the `DialogContent` className:

- Replace `max-h-[85vh]` with `h-[85vh]`
- Keep `flex flex-col` so the inner scrollable region continues to fill the remaining space

Result: the modal always renders at 85% of the viewport height, regardless of how many layers, filters, or summary states are active. The inner table area absorbs any size differences via its existing scroll container.

## Files
- `src/components/config/CompleteLayersDialog.tsx` — single className tweak on the DialogContent element
