# Modal editor assessment

## Decision

No implementation is planned at this stage. Moving source definitions into dialogs is feasible and would make the Layers page more consistent, but it should be treated as a staged interface migration rather than a simple wrapper change.

## Findings

- Dataset, statistics, constraint, and chart forms currently replace the entire Layers view through one shared form-state flow.
- Their add, edit, save, and update callbacks can largely remain unchanged; the saved configuration model does not need to change.
- Keeping the layer card visible behind an editor would preserve context and remove most of the current “return, re-expand, and scroll back” experience.
- Dataset and statistics editing are closely related and are the safest candidates to migrate together.
- Constraint editing already opens a bulk-range dialog, while chart editing opens band-label and field-selection dialogs. A parent editor dialog therefore requires deliberate nested-dialog handling.
- The chart editor needs more horizontal and vertical space than the other forms because it contains previews and two-column controls.

## Implications of a future migration

1. Introduce a shared large editor-dialog shell with a scrollable body and persistent action area.
2. Use the same shell for datasets, statistics, and constraints; use an extra-wide variant for charts.
3. On smaller screens, present these editors as full-screen dialogs rather than constrained popups.
4. Route close button, Escape, backdrop click, and Cancel through one unsaved-change decision so no dismissal path loses work.
5. Preserve the existing form components and save callbacks initially; remove their outer page cards only where the dialog provides that structure.
6. Review every child popup for focus, keyboard, overlay, and stacking behavior inside the parent dialog.
7. Remove or simplify the layer re-expansion and scroll restoration logic only after confirming the modal leaves the original layer context stable.
8. Reconcile the existing unused chart-dialog implementation before creating another chart wrapper.

## Recommended sequence if revisited

1. Dataset and statistics editors.
2. Constraint editor and its bulk-range child dialog.
3. Chart editor and its child dialogs/previews.
4. Layer add/edit only as a separate decision; it is a multi-step workflow and need not follow automatically.

## Risk assessment

- Data/schema risk: low.
- State-management risk: moderate.
- Accessibility and nested-dialog risk: moderate.
- Responsive layout risk: moderate, highest for charts.
- Regression risk is lowest with a staged migration and focused add/edit/cancel tests for each source type.
