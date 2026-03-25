

## Change JSON Editor to Show Only the Style Array

### Problem
The editor currently shows `{ "style": [...] }` which is confusing — users might think they're editing the entire data object. Since the editor is specifically for the `style` property, it should only show the array contents directly.

### Change — `src/components/layers/components/VectorStylingDialog.tsx`

**Initial JSON**: Change from `JSON.stringify({ style: styleArray }, null, 2)` to just `JSON.stringify(styleArray, null, 2)` — so the editor shows `[]` or `[{ ... }, ...]` directly.

**Save logic**: Parse the JSON and validate it's an array (not an object with a `.style` property). Apply the parsed array directly.

**Description text**: Update to say something like: *Edit the style array below. On save, it will be set as the `"style"` property on all vector data sources in this layer.*

### Files modified
1. `src/components/layers/components/VectorStylingDialog.tsx`

