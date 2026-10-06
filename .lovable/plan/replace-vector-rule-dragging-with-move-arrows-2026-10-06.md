# Replace vector rule dragging with move arrows

## Changes

1. Remove native drag-and-drop and the grip handle from each vector-style rule.
2. Add compact Up and Down controls to the right, outside each rule card, matching the existing layer controls:
   - single-click moves one position;
   - double-click moves to the top or bottom;
   - unavailable directions are disabled;
   - tooltips and accessible labels explain both actions.
3. Keep rule selection, duplicate, and delete controls unchanged inside the card. Moving a rule keeps that rule selected.
4. Insert all newly created content at the top of the stack:
   - blank rules;
   - duplicated rules;
   - complete recipe-generated rule groups, preserving their internal order.
5. Preserve OpenLayers fallback semantics: an “everything else” rule remains last even when new rules are inserted or duplicated.

## Verification

- Update focused vector-style tests for arrow movement, top/bottom jumps, disabled edge controls, and top insertion for blank, duplicate, and recipe-generated rules.
- Run the focused vector styling tests and TypeScript checks.
- Confirm the preview reports no build errors. Detailed visual testing remains with you.

## Technical details

- Reuse the established layer move-control interaction pattern, adapted to the smaller rule rows.
- Update recipe merging so newly generated non-fallback rules are prepended while any fallback rule remains at the end.
- Remove obsolete drag state and native drag event handling from the rule list; no schema or saved-style format changes.
