# Simplify the STAC asset and filter controls

## Goal

Reduce the STAC form to a compact, linear workflow: choose an asset and confirm its format, set an optional result limit, then add only the spatial or date filters that are needed.

## Asset selection

1. Replace the current stacked asset controls and detected-format status with one two-column row:
   - **Asset name** on the left.
   - **Asset format** on the right.
2. Keep asset discovery from the first STAC item. In the open asset list, show each recognised option as `name — format`; after selection, the closed field shows only the asset name.
3. Populate **Asset format** immediately from the discovered asset metadata when available, while retaining the existing sample inspection needed for band labels.
4. Keep **Manual entry** and **Rescan collection** as compact secondary actions:
   - Manual entry changes the asset-name selector to a text field.
   - In manual mode, **Asset format** becomes a required selector with no automatic option; both values must be supplied before the data source can be saved.
   - Returning to discovered selection restores automatic format population.
5. Remove the separate detected-format badge, override reveal, and Detect-again control. If a discovered asset has no recognised format, require the user to choose one directly in the visible format selector.

## Result limit and filters

1. Place a compact **Result limit** field immediately after the asset row. It accepts only a positive whole number; clearing it removes only the `limit` parameter from the URL.
2. Replace the collapsible filter panel with two actions:
   - **+ Add date filter** opens a date/time dialog with start and end values, including open-ended intervals.
   - **+ Add bbox filter** opens an area dialog with west, south, east, and north values.
3. After saving a dialog, show that filter as a concise badge in the form:
   - Selecting the badge reopens its dialog for editing.
   - A compact remove action clears that filter from the URL.
   - Once present, the corresponding add button is replaced by its badge so the same filter cannot be added twice.
4. Keep the URL as the only saved source of truth. Opening an existing data source parses `limit`, `datetime`, and `bbox` back into the inline field and badges; unrelated query parameters remain untouched.
5. Continue checking whether the URL represents an items endpoint, collection, direct item, or static document. Filter actions are enabled only for queryable item sources, with the existing concise explanation retained for direct items and static documents.

## Form order

```text
Data Format
Data Source URL
Asset name | Asset format
Result limit
Date filter action/badge | Bbox filter action/badge
────────────────────────────────────────
Minimum zoom | Maximum zoom
Z-Index
Timestamp (when applicable)
```

## Technical details

- Refactor `StacQueryEditor` into the compact inline limit/filter summary plus two focused dialogs; keep query parsing, validation, collection-to-items resolution, and URL updates in `src/utils/stacQuery.ts`.
- Update `DataSourceForm` so discovered and manual asset modes have explicit, predictable format requirements without changing the current one-asset `assets` array or the existing singular `assetFormat` field in this task.
- Preserve session-only sample URLs and existing band-label extraction; no resolved asset URL is added to saved configuration.
- Use existing dialog, select, input, badge, button, and semantic styling components.

## Verification

- Extend focused tests for independent `limit`, `datetime`, and `bbox` updates/removals while preserving unrelated URL parameters.
- Cover discovered asset selection, unknown discovered formats, required manual format selection, mode switching, and edit/reopen state.
- Run the relevant STAC unit tests and TypeScript check. Detailed visual verification remains with the user.

## Not included

- The separate future migration from `assetFormat` to the name-keyed `assetFormats` map.
- Multiple asset selection.
- Queryables/CQL2 property filters or map-based bbox drawing.
