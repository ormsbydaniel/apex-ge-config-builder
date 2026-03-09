

## Right-align info badges and draw order indicators

### Problem
Currently, the band count badge, bands array badge, metadata info icon, and draw order (Z-index, level, opacity) are inline with the filename in a single flex group. Their position shifts depending on filename length, making the layout inconsistent.

### Solution
Split the current middle `div` (lines 160–287) into two sections:

1. **Filename area** (left, flexible, truncates) — just the format badge + filename tooltip (already there, lines 143–158)
2. **Info badges area** (right-aligned, non-shrinking) — all the badges and indicators moved to sit adjacent to the action buttons

The row layout becomes:

```text
[FORMAT] [filename...truncated]     [bands] [info] [Z:0] [opacity] [...] | [⏱] [📋] [✏️] [🗑️]
 ← flex, truncates →                ← flex-shrink-0, right-aligned →      ← existing actions →
```

### Changes in `src/components/layers/components/DataSourceItem.tsx`

1. **Remove** the wrapping `<div className="flex items-center gap-1 flex-shrink-0 flex-wrap">` from inside the left flex group (lines 160–287)
2. **Move** all those badges/indicators into a new `<div>` placed between the left filename group and the right action buttons group — as a sibling at the top level of the row, with `flex-shrink-0 flex items-center gap-1 flex-wrap`
3. The filename span gets `flex-1 min-w-0 truncate` so it fills remaining space and truncates

Result: three flex children in the row — `[left: format+name]` `[middle: badges]` `[right: actions]`, with the filename being the only flexible element.

