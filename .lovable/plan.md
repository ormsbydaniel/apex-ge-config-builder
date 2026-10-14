# JSON Style Editor (Data Visualisation)

## What the user gets

A new row at the bottom of the layer card's **Data Visualisation** section: **JSON Style Editor** (code icon + pencil). It opens a large modal for hand-editing the rendering-related config of the layer's datasets, using the same Monaco editor, Reset / Format JSON / Find and Replace toolbar as the existing layer JSON editor.

Unlike the other tools, it is not mutually exclusive — it is an "expert view" over whatever the active tool wrote.

## Modal layout

```text
+-----------------------------------------------------------------+
| JSON Style Editor: <layer name>                                 |
| Apply to: (o) All datasets  ( ) Selected datasets  ( ) One      |
|   [x] 1 S2 Bristol 2024-01 (cog)   [ ] 2 ...  (checklist/select)|
| Fields shown: [x] style [x] bands/convertToRGB [x] opacity      |
|               [x] min/maxZoom [ ] normalize, spectralIndex ...  |
|-----------------------------------------------------------------|
| { "style": {...}, "convertToRGB": true, "bands": [4,3,2],       |
|   "opacity": 0.8, "minZoom": 10 }                    (Monaco)   |
|-----------------------------------------------------------------|
| ! Datasets differ in: style, opacity  (shown from first one)    |
| [Reset] [Format] [Find/Replace]          [Cancel] [Apply]       |
+-----------------------------------------------------------------+
```

### Scope ("Apply to")
- **All datasets** (default) — editor shows one object; on Apply it is written to every dataset in the layer.
- **Selected datasets** — checklist of datasets (index, filename, format badge); same single-object editing applied to the ticked ones.
- **One dataset** — pick one; shows exactly its values (no merge ambiguity).
- Option for **Statistics** datasets as a separate scope group when the layer has them.
- When the in-scope datasets disagree, editor shows the first dataset's values plus a warning listing the differing keys; Apply then makes them identical (confirm prompt).

### Fields shown
Grouped, toggleable key groups (all relevant groups on by default, based on dataset format):
- **Style**: `style` (raster GPU style or vector flat style)
- **Bands**: `bands`, `convertToRGB`, `normalize`, `bandLabels` (read-only hint)
- **Display**: `opacity`, `minZoom`, `maxZoom`, `zIndex`
- **Recipe metadata** (off by default, advanced): `spectralIndex`, `computedComposite`, `styleSource`, `batchStretch`

Editing semantics: keys present are set, keys deleted from the JSON are removed from the datasets (only within the shown groups); keys outside the shown groups are never touched. URL, format, timestamps, assets etc. are never exposed here.

### Safety
- JSON must parse and pass the existing dataset Zod schema before Apply; errors shown inline, Apply disabled.
- Light type checks: opacity 0–1, zooms numeric, bands array of positive integers.
- If `style` is edited while a recipe tool owns it (spectralIndex / computedComposite / per-dataset batch), warn that the recipe editor may overwrite it next time it's saved, with option to also clear the recipe metadata.
- Unsaved-changes confirm on close; single `onSave` dispatch via the existing `onUpdateDataSources`.

## Docs
Add a "JSON Style Editor" section to `docs/layers/data-visualisation.md` (non-exclusive, scope options, which keys).

## Technical details
- New `src/components/layers/components/JsonStyleEditorDialog.tsx`, reusing `MonacoJsonEditor`, `JsonEditorToolbar`, `useJsonEditor`; state initialised in `useEffect` on `open`.
- New pure util `src/utils/styleJson/styleJsonScope.ts`: `STYLE_KEY_GROUPS`, `extractStyleFields(items, groups)`, `diffKeys(items)`, `applyStyleFields(items, indices, edited, groups)` — with Vitest tests.
- Row added in `LayerDataVisualisationSection.tsx` after Vector Styling; no schema changes (all fields already exist in `DataSourceItem`/Zod).

## Open questions
1. Should Apply to "All" also include statistics datasets, or keep them a separate scope? (Proposed: separate.)
2. Should the editor be available on base layers / swipe layers too, or standard layers only?
