# Refine the vector styling rule list

## Changes

1. Rename the left-column heading to **Add another rule** and add clear spacing after the final rule, including when the list is long.
2. Remove the eye control from each rule summary. Put **Duplicate** and **Delete** icon buttons there instead, with accessible labels and tooltips; keep selection and reorder controls working when either action is clicked. Remove those two buttons from the main rule editor, leaving the rule name and property tabs intact.
3. Applying any recipe from **Add another rule** will immediately append its generated rules, without a Replace/Append question. Keep existing rules and edits intact. Preserve the existing rule-order handling for an “everything else” fallback. Starting from scratch continues to add and select a blank rule. For an empty style, choosing a recipe still creates its rules directly.

## Verification

- Add or adjust focused unit tests for append behavior, including existing rules and an “everything else” fallback; run the vector styling unit tests and the project test suite.
- Check the preview reports no build errors after implementation. You will do the visual check in the app and provide screenshots if anything needs adjustment; no screenshots or publication are part of this change.

## Technical details

- Wire the rule-list actions through the existing duplicate/delete handlers in `StyleEditor`; remove their props and controls from `RuleEditorPane`.
- Simplify `VectorStylingDialog` so recipe completion calls the existing append merge directly and no longer opens `ReplaceOrAppendDialog`. Keep recipe-generation and saved-style formats unchanged; no schema changes.
