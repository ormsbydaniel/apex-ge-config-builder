# Fix STAC metadata dialog resizing

## What you'll see

- The STAC Metadata window opens at one fixed size and stays there. It no longer grows and shrinks as you move between the Collection, Item and Asset tabs or as data finishes loading.
- The fixed size matches the COG metadata window at its largest - the point where it needs a vertical scrollbar: 672 px wide, 80% of the screen height tall.
- When a tab has little to show, the window simply keeps its size and leaves whitespace below. Nothing else moves.
- The title and the three tab buttons stay pinned at the top; only the content beneath the tabs scrolls.

## Details

File: `src/components/layers/components/StacMetadataDialog.tsx`

- `DialogContent` currently uses `max-h-[85vh] max-w-3xl overflow-y-auto`, so its height tracks the content of whichever tab is active - the source of the resizing. Replace with a fixed frame: `w-full max-w-2xl h-[80vh] overflow-hidden flex flex-col`. (`max-w-2xl` + `h-[80vh]` is exactly the COG metadata dialog's scrolled footprint; `flex flex-col` replaces the base `grid` display via tailwind-merge.)
- Make the tab area fill the remaining height so only its body scrolls:
  - `Tabs`: `flex min-h-0 flex-1 flex-col`
  - `TabsList`: `shrink-0`
  - each `TabsContent`: `h-full min-h-0 overflow-y-auto` (keeps the component's own `mt-2`)
- Leave everything else alone: tab contents, the "Inspect COG/FlatGeobuf file" button, and the nested inspector dialogs keep their current behaviour. The COG inspector is the same 672 x 80vh size, so it lands exactly over this window.
- No schema, type, or saved-configuration changes.

## Verification

- New test `src/components/layers/components/__tests__/StacMetadataDialog.sizing.test.tsx`: render the dialog for a STAC dataset, assert the panel carries the fixed width/height classes and the active tab panel carries the scroll classes, and assert those classes are identical after switching to another tab (sizing lives on the window, not per tab).
- Run the new test plus the existing `DataSourceItem` tests, then `bunx tsgo --noEmit -p tsconfig.app.json` and check the preview build log.
- Look and feel is yours to check in the preview: open the (i) on a STAC row and click between the three tabs.
