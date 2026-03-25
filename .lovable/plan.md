

## Add Markdown Help Page to Description Editor

### Changes

**`src/components/layers/components/LayerDescriptionAttributionDisplay.tsx`**

1. Add `showHelp` boolean state.
2. Between the "Description" label and the Textarea, add a hint: `"Description supports basic markdown."` followed by a `"Tell me more"` link that sets `showHelp = true`.
3. When `showHelp` is true, replace the modal content with:
   - A header: "Markdown Reference"
   - A `<- Back` button that sets `showHelp = false`
   - A table (using the project's `Table` components) with two columns: **Syntax** and **Example**, listing the 8 supported markdown features
4. Reset `showHelp` to false when the dialog closes.

Import `ArrowLeft` from lucide-react and `Table, TableHeader, TableBody, TableRow, TableHead, TableCell` from the UI table component.

### Table content

| Feature | Syntax |
|---------|--------|
| Hyperlink | `[text](https://url/)` |
| Italics | `*text*` |
| Bold | `**text**` |
| Heading 1 | `# text` |
| Heading 2 | `## text` |
| List | `- item 1` (newline) `- item 2` |
| Quote | `> text` |
| Code | `` `code` `` |

