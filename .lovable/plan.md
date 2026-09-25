# Redesign the Manage Fields dialog as a compact table

Replace the collapsible per-field cards in the "Manage Fields" dialog with the approved "Compact field manager" design: a bordered table where each field is one row with inline editing.

## What changes

### Define fields tab — table layout
- Header row: **Field name | Display label | Prefix | Suffix | Precision | Hide | (delete)**, sticky at the top while scrolling.
- One row per field:
  - Field name in monospace, muted text.
  - Display label, prefix, suffix as inline text inputs; precision as a narrow number input.
  - Hide as a toggle switch; delete as a trash icon that appears on row hover.
- **Hidden fields stay in the same list, greyed out** (reduced opacity, muted background, italic field name, disabled inputs) — matching the JSON model where hidden = `null`. Toggling Hide off re-enables the row's inputs.
- Row hover highlight; inputs show focus ring.
- Keeps the existing "N visible, M hidden" summary line, the "Enter field name…" + **Add Field** row, and the Cancel / Save Changes footer.
- Keeps the three tabs (Define fields / Auto-detect / Copy from layer) unchanged.

### Advanced settings per row
The current card also edits **type**, **format** (date/datetime) and **order**. These move to a small expandable section per row (chevron at the end of the row) so the table stays compact while no functionality is lost.

### Behaviour preserved
- Adding a field appends a new editable row.
- Toggling Hide sets the field config to `null` (hidden) or `{}` (visible) — same as today.
- Auto-detect and Copy-from-layer tabs feed the same table.
- No changes to the fields JSON schema, types, or saved config shape.

## Technical details
- Rework `src/components/form/FieldItem.tsx` into a table-row component (or fold into the parent) and restructure the Define tab in `src/components/form/FieldsEditorTabs.tsx` to render the table with a sticky header inside the existing scrollable area.
- Widen the dialog if needed so the table columns fit comfortably.
- Styling uses the project's semantic design tokens (muted/foreground/border/primary) — no hardcoded colours — so it matches the app theme in light and dark mode.
- Icon-only delete buttons get `aria-label`s; inputs get unique ids per row.
- Verify with a Playwright capture of the dialog using a vector-layer config, and run the existing test suite.
