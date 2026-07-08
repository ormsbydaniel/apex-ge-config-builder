## Goal
Add a grey background behind the step cards in the Storymaps Steps section, matching the visual treatment used for layer cards in the Layers UI.

## Context
- Step cards are rendered inside `SortableStoryGroup.tsx` (lines 289-343), currently on the story group's default `bg-muted/10` background.
- The equivalent Layers UI pattern is in `LayerGroup.tsx` line 295, where the card list container uses `bg-slate-200` padding to create visual distinction between cards.

## Implementation
1. In `src/components/config/storymaps/SortableStoryGroup.tsx`, wrap the `DndContext` / `SortableContext` / step cards block inside a container with the same grey background treatment used in the layers UI (e.g. `bg-slate-200 rounded-md p-2 space-y-2`).
2. Preserve existing spacing, drag-and-drop, and empty-state behaviour.
3. No changes to `SortableStepCard.tsx` styling unless the grey background reveals a need for minor spacing adjustments.

## Verification
- Visually confirm the steps list now has a grey background behind the cards in the preview.
- Ensure cards remain visually distinct and the layout does not break when collapsed/expanded or when dragging.
