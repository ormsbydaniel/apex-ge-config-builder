# Select the newly created rule after applying a recipe

## Problem

When a rule already exists and the user picks a recipe from "Add another rule", clicks **Create rule**, and lands back in the two-pane editor, the top rule is selected instead of the one just created. Cause (confirmed in code): `handleRecipeRules` in `VectorStylingDialog.tsx` appends the generated rules and switches the view to the editor, but `StyleEditor` holds its selection in internal state that is never told about the new rule — it stays wherever it was (index 0).

## Change

Small, targeted fix — no schema or recipe-logic changes.

1. **`src/components/layers/components/VectorStylingDialog.tsx`**
   - In `handleRecipeRules`, after appending, pass the index of the first newly generated rule (append places generated rules at the end, so it is `current.length` before the append) to `StyleEditor` as a new `focusRule` prop (index + a nonce so re-selecting the same index still registers).
   - Also clear `recipe`/reset wizard state as today.

2. **`src/components/vectorStyle/StyleEditor.tsx`**
   - Accept the new optional `focusRule` prop; a `useEffect` on it sets `selected` to the given index (and keeps the existing clamp behaviour).
   - Scroll the newly selected rule into view in the rule list (the list scrolls inside `max-h-48`), so a long list shows the new rule.

3. **`src/components/vectorStyle/RuleListPane.tsx`**
   - No functional change; the selected row already renders selected. Add `scrollIntoView` on the selected item when the focus changes (via a small effect keyed on the selected index changing from outside).

4. **Test**
   - Extend `StyleEditor.test.tsx` (or add a focused test): simulate the editor mounting with existing rules, then applying a recipe append — assert the newly appended rule is the selected one in the editor pane.

## Verification

- Unit tests: full vitest styling suite.
- Build diagnostics from `/tmp/observability/build-errors.log`.
- User does visual testing in the preview (create a second rule via a recipe and confirm the editor opens on it, including with a long rule list).
