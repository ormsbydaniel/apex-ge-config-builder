# Simplify field population in Manage Fields

## Experience
- Remove the **Auto-detect** tab. Keep **Define fields** and **Copy from layer**.
- Add **Populate field details** above the Define fields table. With one supported vector file in the current layer, clicking it reads that file immediately. With several, clicking it opens a searchable, scrollable file picker; selecting a file starts population. Show a short, identifiable file name with the full URL available for distinguishing similar entries. Keep the picker bounded in height for long lists.
- If no supported file is available, disable the button with a clear explanation. Show progress while reading and a useful error if the file cannot be read or contains no fields.
- Merge safely: append newly discovered fields to the table without changing existing labels, prefixes, suffixes, precision, types, hidden settings, or row positions. Apply detected Date/DateTime types to new rows when supported by the Type column; leave other detected types at Default. Users can still edit, hide, reorder, and save as before.

## Technical details
- Pass the current layer's full data-source list through all entry points to the shared fields dialog, rather than passing only its first vector URL. Identify sources by their array position so duplicate URLs remain selectable. Limit choices to GeoJSON and FlatGeoBuf formats supported by the existing field detector; WFS is not yet supported for field detection.
- Reuse the existing detection utility. Replace the separate detected-fields selection/append/replace flow with an in-place merge on Define fields. Preserve current row order and use `src/utils/fieldOrder.ts` to derive explicit saved `order` values from visible rows, including newly appended fields; do not rely on JSON key order for display order.
- Keep the Copy from layer flow unchanged. No config schema or saved JSON shape changes.

## Verification
- Check one-file immediate population, multi-file search and selection with a long list, unavailable/failed sources, and existing hidden/customised fields remaining intact after population and save/reopen. Confirm newly added Date/DateTime types and field order persist. Run focused tests and verify the modal in the preview.
