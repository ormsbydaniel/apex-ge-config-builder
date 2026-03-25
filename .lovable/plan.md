

## Show `"style": [ ]` in the JSON Editor

### Problem
The editor currently shows just `[]` which lacks context about what property is being edited. The user wants it to display `"style": [ ]` as a middle ground — not the full object wrapper `{ "style": [...] }`, but enough context to make it clear.

### Change — `src/components/layers/components/VectorStylingDialog.tsx`

**Initial JSON**: Change from `JSON.stringify(styleArray, null, 2)` to a template that produces:
```
"style": [
  ...
]
```

This means building the string as `"style": " + JSON.stringify(styleArray, null, 2)` (with proper indentation for array contents).

**Save logic**: Strip the `"style":` prefix before parsing — extract everything after the first `:`, trim, then `JSON.parse` as an array. Validate it's an array as before.

**Validation on input**: Also accept if the user has modified the key name or removed it — fall back to trying to parse the raw content as an array if the prefix-strip approach fails.

### Files modified
1. `src/components/layers/components/VectorStylingDialog.tsx`

