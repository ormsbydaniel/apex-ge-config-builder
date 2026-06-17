# View raw `record.json` from the Algorithm Catalogue browser

Add a per-row JSON button in `CatalogueBrowserDialog` that swaps the dialog body into a read-only JSON view of the algorithm's catalogue record, with a "← Back" button to return to the listing.

## Changes (single file: `src/components/config/workflows/dialogs/CatalogueBrowserDialog.tsx`)

1. **Add view-mode state** — `const [viewingJson, setViewingJson] = useState<CatalogueEntry | null>(null)`. Reset to `null` whenever the dialog is closed (already handled by the existing `open` effect — extend it).

2. **Add a JSON action button per row** — a new leftmost narrow column (or appended after Description) containing a ghost icon button using lucide's `FileJson` icon. `onClick` calls `e.stopPropagation()` then `setViewingJson(entry)` so it doesn't trigger row selection. Wrap in a `Tooltip` ("View raw record.json").

3. **Conditional render in the dialog body**:
   - When `viewingJson` is set, replace the search bar + table + footer-right buttons with:
     - Header strip: `← Back to catalogue` button (sets `viewingJson(null)`), entry name as title, and the source URL as a small caption.
     - Body: `<pre>` containing `JSON.stringify(viewingJson.record, null, 2)` inside a scrollable container that fills the dialog height. Use `font-mono text-xs whitespace-pre` with `overflow-auto`.
     - Footer: just a Close button on the right (no Use selected / Skip in this mode).
   - When `viewingJson` is null, render the existing listing UI unchanged.

4. **No changes** to schema, types, parent components, or the catalogue loader — `entry.record` is already the parsed `record.json` available in memory.

## Out of scope
- Copy-to-clipboard or download (can be added later if asked).
- Syntax highlighting (plain `<pre>` is consistent with existing read-only JSON we render elsewhere).
