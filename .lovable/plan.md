

## Fix: Truncate long filenames to prevent layer card overflow

### Problem
The data source row has many `flex-shrink-0` badges (format, bands, info buttons, zoom, opacity, etc.) alongside the filename. When the filename is long, the row expands beyond the card container because the filename span, despite having `truncate`, competes with all the non-shrinking badges in a single flex row.

### Solution
Two changes in `src/components/layers/components/DataSourceItem.tsx`:

1. **Add `overflow-hidden` to the outer flex container** (line 141) so the row is constrained to its parent width.

2. **Wrap badges into a separate flex-wrap group** — split the row into:
   - The format badge + filename (with `min-w-0` and `truncate` so the name truncates)
   - The remaining badges in a `flex-wrap` container so they wrap to a second line rather than forcing horizontal expansion

Specifically:
- Line 141: Add `overflow-hidden` to the outer div
- Line 142: Add `overflow-hidden` to the inner flex div  
- Line 150: Ensure the display name span has `min-w-0` in addition to `truncate` (it already has `truncate` and `flex-1`)
- After the display name tooltip (line 158), wrap all the remaining badges (lines 160–295) in a `<div className="flex items-center gap-1 flex-wrap flex-shrink-0">` so they wrap instead of expanding the row, but with a reasonable `max-w-[60%]` or similar constraint

Actually, the simpler and more robust fix: just limit the display name with `max-w-[200px]` on the span (line 150) so it always truncates long names, keeping the existing layout intact.

### File: `src/components/layers/components/DataSourceItem.tsx`

- Line 141: Change outer div to include `overflow-hidden`
- Line 150: Add `max-w-[200px]` to the display name span to cap its width and ensure truncation works regardless of badge count

