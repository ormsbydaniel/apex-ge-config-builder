# Vector styling rule-list refinements

## Changes

1. **Open a blank rule immediately from the home page**
   - Make **Start from scratch** on the full recipe-card page create and select one blank rule before opening the editor.
   - The user will arrive directly at the right-hand rule definition instead of seeing a second empty-state prompt.

2. **Return home after deleting the final rule**
   - When the last rule is deleted, switch the dialog back to the full recipe-card home page.
   - Keep deletion of any rule in a multi-rule style within the two-pane editor and select the nearest remaining rule.

3. **Add recipe tooltips in the left panel**
   - Add the existing recipe description to each compact recipe button under **Add another rule**.
   - Add a matching explanatory tooltip to **Start from scratch**.
   - Use the established tooltip timing and components already used by the application.

4. **Use drag handles as the only ordering control**
   - Remove the up/down chevrons from each rule summary.
   - Preserve drag-and-drop ordering, the visible drag handle, selection behavior, and the duplicate/delete actions.

## Technical details

- Coordinate the home/editor transition in `VectorStylingDialog` so both initial blank-rule creation and final-rule deletion update the rules and visible page together.
- Pass a final-rule-deleted callback through `StyleEditor`; do not change saved style data or recipe generation.
- Reuse descriptions from the shared recipe definitions to avoid duplicating tooltip copy.
- Keep existing recipe additions append-only.

## Verification

- Add focused tests for:
  - Home-page **Start from scratch** creating a blank selected rule.
  - Deleting the sole rule returning to the recipe home page.
  - Deleting one of several rules keeping the editor open with a valid selection.
  - Recipe and scratch tooltip content.
  - Drag reordering after chevron removal.
- Run the full unit test suite and check the current build diagnostics.
- Leave visual testing and screenshots to you, as requested.
