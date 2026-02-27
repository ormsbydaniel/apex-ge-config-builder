

## Paginate Data Sources in DataSourceDisplay

### Problem
Layers with 800+ data sources render all items at once, making the UI unwieldy.

### Approach
Add pagination (10 items per page) to `DataSourceDisplay.tsx` using the existing `Pagination` UI components.

### Implementation

#### `src/components/layers/components/DataSourceDisplay.tsx`

1. Add `useState` for `currentPage` (default 0), reset to 0 when `source.data.length` changes.
2. Slice `source.data` to show only 10 items per page: `source.data.slice(page * 10, (page + 1) * 10)`.
3. Pass the **original index** (`page * 10 + index`) to callbacks so edit/remove target the correct item.
4. Show item count summary ("Showing 1–10 of 823") and `Pagination` controls (Prev/Next + page numbers) below the list when there are more than 10 items.
5. Statistics section stays unpaginated (typically small).

No other files need changes — the pagination is fully contained within this component.

