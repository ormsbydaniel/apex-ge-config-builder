# Keep styling recipes visible beside the rules

## Change

- Remove the **New from recipe** button from the styling dialog header.
- Beneath the rule list in the left column, add an **Add another** section with compact, individually clickable choices for the five existing recipes: Categorised, Graduated, Simple uniform, Feature labels, and Filter / highlight. Include **Start from scratch** as the sixth choice.
- Choosing a recipe opens its existing setup screen directly, without an intermediate gallery. Returning from setup brings the user back to the two-pane editor when they started there; the existing empty-style gallery remains the first screen for a new layer.
- **Start from scratch** adds a blank rule and selects it in the right-hand editor. Keep the existing Replace / Append prompt when a recipe is applied to existing rules, and preserve the JSON editor and Save behaviour.
- Keep the left column usable with long rule lists and on smaller screens; the choices should remain identifiable without crowding rule controls.

## Verification

- Check each of the six choices, back navigation, Replace / Append, and adding a blank rule; confirm existing edits survive moving between the editor and recipe setup.
- Check the dialog with empty, single-rule, and long rule lists at desktop and narrow widths. Run the relevant styling tests and confirm the preview reports no errors.

## Technical details

- Reuse the existing recipe definitions, wizard, and merge behaviour rather than changing rule generation or the saved style format.
- Wire the compact choices through the existing dialog view state and the rule editor; no configuration schema or data migration is needed.
