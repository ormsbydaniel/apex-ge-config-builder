# Refine "Apply constraints" modal

Keep the existing "one card per layer" model — each "Apply constraints" action targets exactly one layer. Rework the modal so the layer picker is scoped to the step's active layers, and the constraints list is driven by that layer's authored constraints instead of a free-form label picker.

## Flow

1. **Add action → Apply constraints** — creates a new card and opens the modal empty (no layer preselected).
2. **Select layer** — dropdown listing only the current step's active layers (from `step.layers.active`). If the step has no active layers, show a hint ("Add active layers first") and disable Save.
3. **Select constraints** — once a layer is chosen, look up its `DataSource` and read `source.constraints` (`ConstraintSourceItem[]`). Render one row per authored constraint with a checkbox to enable it. States:
   - source has none → "No constraints defined for this layer."
   - source has one/many → each shown with its authored label.
4. **Define constraint settings** — inputs appear inline under each ticked constraint, driven by its `type`:
   - `continuous` → Lower / Upper numeric inputs, defaulted to the source's `min` / `max`.
   - `categorical` → checkbox list of `constrainTo` options (label + value). No free-text add box.
5. **Save** — writes back a single `StoryStepControl` for that layer.
6. **Edit later** — clicking the card's pencil reopens the same modal with the layer pre-selected and its previously configured constraints pre-ticked and pre-filled, so the user lands on step 4/5.

To configure constraints on a second layer (e.g. "solar energy"), the user repeats Add action → Apply constraints, producing a second card.

## Guard rails

- Prevent picking a layer that already has an "Apply constraints" card in this step (grey it out in the dropdown with a "(already configured)" suffix), so we never end up with two cards for the same layer.
- Opacity and Blend inputs stay in the modal, unchanged, as per-layer settings on the same control.

## Data model

No schema changes. Reuses existing `StoryStepControl` (single `layer` field) and `StoryConstraintSelection` shapes. The modal simply constrains what the user can pick and how they configure it.

## Files touched

- `src/components/config/storymaps/actions/ActionEditors.tsx`
  - `LayerControlEditor`: scope the layer dropdown to `step.layers.active` (new prop `activeLayerIds` + resolve names via `sources`); exclude layers already used by other `step.controls`; disable Save until a layer is picked; render the constraints list from `source.constraints` only.
  - `ConstraintSelectionRow`: replace the "Pick constraint" label dropdown with a fixed row per authored constraint (checkbox + type-specific inputs). Drop the "(unknown)" fallback.
  - `CategoricalValuesEditor`: remove the manual add input; render only the authored `constrainTo` options as checkboxes.
- `src/components/config/storymaps/actions/ActionsAndLayersSection.tsx`
  - Pass `step` (for active layers + sibling controls) into `LayerControlEditor`.
  - When picking "Apply constraints" from the Add menu, still append a new empty control (as today) and open its editor.

No changes to `src/types/story.ts`, `src/schemas/storySchema.ts`, or validation hooks.
