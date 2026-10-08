# STAC datasets: Timestamp optional on temporal layers

## Goal
On temporal layers, STAC datasets get their date from the STAC item's own `datetime`, so the Timestamp field should no longer be required. Users can still enter one by hand to override the item's date.

## Behaviour
- STAC data source on a temporal layer:
  - The Timestamp label shows "(optional)" in place of the asterisk.
  - The help text reads: "Leave blank to use each STAC item's own datetime. Set a date only to override it."
  - Saving with no date works: there's no "Missing Timestamp" warning, and no `timestamps` value is saved.
  - If a date is entered, it's saved to `timestamps` as it is today (the manual override).
- Editing an existing STAC dataset that has a saved timestamp still shows that date, and clearing it removes the override.
- WMS/WMTS, COG, GeoJSON, FlatGeoBuf and the other formats stay as they are.

## Technical details
- `DataSourceForm.tsx`: add `isStacSource = selectedFormat === 'stac'` and change `needsManualTimestamp` to `requiresTimestamp && !isStac && (...)` so the save check skips STAC.
- When saving a STAC source, write `timestamps` only if `selectedDate` is set. Otherwise delete it, so clearing the date really removes the override.
- Update the label and help text in both Timestamp sections (direct and service): `*` becomes "(optional)" for STAC.
- Add a "Clear" button beside the date input for STAC, so the user can remove an override (clear `selectedDate` and `dateInputValue`).
- No schema changes: `timestamps` is already optional.
- Tests: a focused test of the save-requirement helper (STAC temporal → not required; COG temporal → required). Pull the condition into a small pure function so it can be tested.
