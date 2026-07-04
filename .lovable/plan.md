## Remove Cancel / Save Step footer from the step card

All step edits now flow through modals (Content, per-action editors, JSON) that each have their own Cancel/Save. The card-level footer is redundant and inconsistent with the layer card pattern.

### Changes to `StepEditor.tsx`
- Remove the bottom `Cancel | Save step` footer row entirely.
- Drop the local `working` state, the `dirty` computation, the `onDirtyChange` effect, and the `useEffect` that resets `working` from the incoming `step`.
- Read directly from the `step` prop for display (description, id, title).
- Wire `ActionsAndLayersSection` `onChange` straight to `onSave` so action editor saves commit immediately (same pattern the Content modal already uses).
- The Content modal continues to call `onSave` on its own Save button; its Cancel-on-new-step rollback path is unchanged.
- Remove the now-unused `onCancel` and `onDirtyChange` props from `StepEditorProps`.

### Changes to `SortableStepCard.tsx`
- Stop passing `onCancel={onToggleExpanded}` and `onDirtyChange` to `StepEditor` (props are gone).
- The card's existing chevron toggle continues to collapse/expand; no replacement close button needed.

### Changes to `SortableStoryGroup.tsx`
- Remove the `onStepDirtyChange` wiring passed into `SortableStepCard` (no longer used). If other callers of `SortableStoryGroup` still pass `onStepDirtyChange`, keep the prop as a no-op accepted-but-ignored to avoid a wider refactor — or drop it if the parent doesn't use it. I'll check the parent usage during implementation and drop it cleanly if safe.

### Out of scope
- No changes to the Content, JSON, or per-action modals themselves.
- No changes to unsaved-change guards inside the individual modals (they already handle their own dirty state).