# Categories modal improvements

Three changes, in this order: fix the stale-state bug first, then redesign the modal to a single editing surface, then add CSV import/export on top.

## 1. Fix stale categories bug (issue c)

`useCategoryEditorState.ts` initialises `localCategories` and `useValues` via `useState(...)`, which only runs on first mount. Because `CategoryEditorDialog` stays mounted across opens, reopening the modal after a copy shows stale data.

Add a `useEffect` watching the `open` prop. When `open` transitions to `true`, reset:
- `localCategories` from the current `categories` prop
- `useValues` from the current `categories` prop
- `activeTab` to its default
- `selectedSourceLayer` to `''`
- `newCategory` to its empty default

This matches the project Core rule: *"Initialize dialog state inside `useEffect` watching the `open` prop to prevent stale overwrites."*

## 2. Redesign modal as single editing surface (issue b)

Remove the two-tab structure. Replace with one editing view that always shows the current categories, plus a row of action buttons above the list:

```text
┌─ Edit Categories for <Layer Name> ────────────────────┐
│  [+ Add]  [Copy from layer ▾]  [Import CSV]  [⬇ Export CSV]  │
│  ☐ Use values                                         │
├───────────────────────────────────────────────────────┤
│  ● Forest    #2E7D32   1     [edit] [×]              │
│  ● Water     #1565C0   2     [edit] [×]              │
│  ● Urban     #9E9E9E   3     [edit] [×]              │
├───────────────────────────────────────────────────────┤
│                              [Cancel]  [Save]         │
└───────────────────────────────────────────────────────┘
```

Behaviour:
- **Add** opens the existing inline add form (reuse `CategoryAddForm`).
- **Copy from layer** is a popover/dropdown: pick a layer → if list is empty, copy immediately; if not, show Append / Replace choice inline. Result populates the visible list — no tab switch, no separate Save semantics.
- **Save** only ever persists `localCategories`. It never triggers a copy.
- **Cancel** discards local edits.
- Export CSV is disabled when the list is empty.

Code changes:
- Delete `CategoryEditorTabs.tsx` and `CategoryCopyFromLayer.tsx` (move salient bits into a new `CategoryCopyFromLayerButton.tsx` popover).
- Remove the legacy `showCopyConfirmation` AlertDialog and its state from `CategoryCopyLogic.tsx` — keep only the Append/Replace dialog (rename actions to "Add to existing" / "Replace all").
- Simplify `CategoryEditorDialog.handleSave` to a single line: `onUpdate(localCategories); handleOpen(false);`.
- Remove the `activeTab === 'copy'` branch and the `setActiveTab('manual')` side-effect in `performCopy`.
- Per project guideline, move the deleted files to `src/utils/deprecated/` (or `src/components/deprecated/`) with a README explaining they were superseded by the unified editor, rather than hard-deleting.

## 3. CSV import/export (issue a)

New utility `src/utils/categoryCsv.ts` with two pure functions:

- `categoriesToCsv(categories, useValues): string` — produces `label,color,value` (or `label,color` when `useValues` is false). Quote labels containing commas/quotes. Always emits `#RRGGBB` colours.
- `parseCategoriesCsv(text): { categories: Category[]; useValues: boolean; errors: { row: number; message: string }[] }` — header-row required, accepts `label,color` or `label,color,value` in any column order, validates hex colours, coerces `value` to integer, flags duplicates and malformed rows. `useValues` is true iff a `value` column is present and every row has one.

UI:
- **Export CSV** button triggers a download named `<layerName>-categories.csv`.
- **Import CSV** button opens a hidden `<input type="file" accept=".csv,text/csv">`. After parse:
  - If errors exist, show a small inline error panel listing row numbers — do not import.
  - If clean and current list is empty, replace silently.
  - If clean and current list is non-empty, reuse the existing Append/Replace dialog (with the parsed set as `pendingCopyData`).
  - When the parsed file has values but the editor was in "no values" mode (or vice versa), auto-switch `useValues` to match the file and show a one-line toast explaining the change.

CSV format documented in a short comment at the top of `categoryCsv.ts`:
```text
label,color,value
Forest,#2E7D32,1
Water,#1565C0,2
"Mixed, urban",#9E9E9E,3
```

## Technical details

- Files to edit:
  - `src/hooks/useCategoryEditorState.ts` — add reset `useEffect`, drop tab-related state.
  - `src/components/form/CategoryEditorDialog.tsx` — new layout, single Save path.
  - `src/components/form/CategoryCopyLogic.tsx` — remove legacy dialog, rename actions.
- Files to add:
  - `src/utils/categoryCsv.ts` — parse/serialise.
  - `src/components/form/CategoryCopyFromLayerButton.tsx` — popover replacing the tab.
  - `src/components/form/CategoryCsvActions.tsx` — Import/Export buttons.
  - `src/utils/__tests__/categoryCsv.test.ts` — unit tests for round-trip, error cases, value-detection.
- Files to deprecate (move under `deprecated/` with README + `@deprecated`):
  - `CategoryEditorTabs.tsx`, `CategoryCopyFromLayer.tsx`.
- No schema or type changes — `Category` shape is unchanged.
- Reuse existing `normalizeCategories` from `src/utils/categoryValidation.ts` after CSV import for value deduplication consistency.

## Out of scope

- Cross-config CSV sharing UI (the export file itself already serves this).
- Bulk recolouring from a palette (separate feature).
- Changes to how categories render in the legend or on the map.
