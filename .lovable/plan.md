

## Add Bands Array Badge to DataSourceItem

### What
Display a badge showing the configured band indices (e.g., `[1, 4, 3]`) on data source items that have a `bands` array defined. This gives immediate visibility into which bands are selected for rendering without needing to inspect the raw config.

### Changes

**`src/components/layers/components/DataSourceItem.tsx`**
- Check if `dataSource.bands` exists and is a non-empty array
- Render a `Badge` showing the band values, e.g., `"Bands: 1, 4, 3"` — placed next to the existing band count badge for COGs
- Use the `secondary` variant to match the existing band count badge style
- Keep it compact: for very long arrays (>5 bands), truncate with ellipsis, e.g., `"Bands: 1, 2, 3, 4, 5…"`

No schema, type, or other file changes needed — `DataSourceItem` already supports arbitrary properties via `[key: string]: any`.

