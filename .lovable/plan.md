
# Plan: Unify Drag Visual Feedback for Layers

## Problem
Currently, the drag-and-drop visual feedback is inconsistent:
- **Within-group reordering**: Shows the greyed-out card at target position (via `@dnd-kit/sortable` transforms)
- **Cross-group moves**: Shows a horizontal insertion line above the target card
- **Interface group reordering**: Shows the greyed-out card at target position

This inconsistency is confusing for users.

## Root Cause
Each interface group (and sub-group) currently has its own `SortableContext`. When dragging within a context, `@dnd-kit/sortable` automatically calculates transform positions. When dragging *across* contexts, these transforms don't work, so a manual insertion line was added.

## Solution
Replace the multiple `SortableContext` instances with a **single SortableContext** that contains all layers. The collision detection and drop handling already support cross-group moves, so this change will allow the standard sortable visual feedback to work everywhere.

## Implementation Steps

### 1. Restructure SortableContext in LayerHierarchy
Move the `SortableContext` for layers from individual group components to a single wrapper that contains all layer IDs in their display order.

**File**: `src/components/layers/LayerHierarchy.tsx`
- Create a single `SortableContext` with all layer IDs in visual order
- Maintain the existing group structure for rendering, but layers share one sortable context

### 2. Update LayerGroup Component
Remove the internal `SortableContext` from `LayerGroup`.

**File**: `src/components/layers/components/LayerGroup.tsx`
- Remove `SortableContext` wrapper around layers
- Keep the `DroppableGroupZone` for empty-group drops and auto-expand functionality

### 3. Update SubInterfaceGroup Component
Remove the internal `SortableContext` from `SubInterfaceGroup`.

**File**: `src/components/layers/components/SubInterfaceGroup.tsx`
- Remove `SortableContext` wrapper around layers
- Keep the droppable zone for targeting sub-groups directly

### 4. Simplify SortableLayerCard
Remove the cross-group insertion line and content shift since standard sortable behavior will now handle all cases.

**File**: `src/components/layers/components/SortableLayerCard.tsx`
- Remove `isReceivingCrossGroupDrop` logic
- Remove the horizontal insertion line (`bg-primary` div)
- Remove the `translate-y-1` content shift
- Keep the opacity and transform styles that power the greyed-out card effect

## Technical Notes

### Maintaining Correct Visual Order
The single `SortableContext` needs layer IDs in their visual render order:
1. First, layers in Interface Group A's sub-groups
2. Then, ungrouped layers in Interface Group A  
3. Then, layers in Interface Group B's sub-groups
4. And so on...

This order must be computed in `LayerHierarchy` and passed to a single `SortableContext`.

### No Changes to Drop Logic
The existing `handleDragEnd` in `LayerDndContext` already correctly handles both same-group and cross-group drops by examining the `interfaceGroup`/`subinterfaceGroup` properties. This will continue to work unchanged.

### Collision Detection Unchanged
The `customCollisionDetection` logic remains valid and will continue to prioritize layer-over-layer collisions for precise positioning.

## Expected Outcome
After this change:
- Dragging a layer within a group: greyed-out card at target position
- Dragging a layer to a different group: greyed-out card at target position
- Dragging an interface group: greyed-out card at target position

All three cases will have consistent, unified visual feedback.
