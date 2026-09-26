# Refine the Manage Fields table

## Changes
- Remove each row’s expand chevron and the expandable settings row. Put **Type** directly in the table alongside the existing field settings. For Date and DateTime fields, retain an inline **Format** input so existing date formatting remains editable; keep the table usable with horizontal scrolling at narrower widths.
- Keep the drag handle and up/down controls. On opening the dialog, show fields with explicit `order` values in that order, with unordered fields following in their existing order. When fields are dragged or moved, update each visible field’s explicit `order` to match its position in the table (starting at 1); hidden fields remain `null`. On saving other edits, also make the saved display order match the rows shown. JSON object-key order is not relied on for display order.
- Preserve the existing three tabs, hide/unhide behaviour, field values, and saved configuration shape. Removing the manual Order input makes row position the sole way to set display order.

## Technical details and checks
- Adjust the row/table components and dialog save path without changing the schema. Preserve existing `format` values when Type changes unless deliberately edited.
- Check a config with pre-existing, nonsequential order values; verify drag and chevron moves produce explicit `order` values in the saved JSON and remain in that order when reopened. Also verify hidden fields, Date/DateTime formatting, and the dialog at narrow widths; run relevant tests.
