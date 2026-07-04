## Add JSON view/edit dialog to each story step

Reuse the existing pattern from `LayerJsonEditorDialog` (Monaco-based, view + edit modes, unsaved-change guard) to give each step a `{ }` button that opens a full JSON editor for that single step.

### New file
- `src/components/config/storymaps/StepJsonEditorDialog.tsx`
  - Mirrors `LayerJsonEditorDialog` structure: `MonacoJsonEditor` + `JsonEditorToolbar` + `useJsonEditor`.
  - Props: `isOpen`, `onClose`, `step: StoryStep`, `onSave(next: StoryStep)`.
  - Validates on apply by running the edited JSON through `StepSchema` from `src/schemas/storySchema.ts` and surfacing errors via toast (same UX as layer dialog).
  - Title: `Edit Step JSON: {step.title}`.

### Wiring into the step card
- `src/components/config/storymaps/SortableStepCard.tsx`
  - Add a `FileJson` icon button in the header actions row (next to Duplicate/Delete, before the divider) with tooltip "Edit JSON".
  - Local `jsonOpen` state; render `<StepJsonEditorDialog>` when open.
  - On save, call the existing `onSave(next)` prop so the change flows through the normal step-update path (same one used by `StepEditor`) — no schema/type sync work needed since we're just replacing an existing `StoryStep`.

### Behaviour notes
- Read-only by default, "Enable Editing" reveals the toolbar (matches layer dialog).
- Unsaved-change confirm on close (reuses hook state).
- No changes to `StepEditor` or the Content modal — this is purely an extra escape hatch on the card header.

### Out of scope
- No bulk/multi-step JSON editing.
- No changes to the story-level or config-level JSON editors.