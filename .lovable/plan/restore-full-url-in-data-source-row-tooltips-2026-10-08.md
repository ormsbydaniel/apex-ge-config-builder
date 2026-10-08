# Restore full URL in data source row tooltips

The row label keeps the 80-character truncation, but hovering the name shows the complete URL again (full path for COGs, vector files, STAC items and STAC queries including their query parameters).

## Change
- `src/components/layers/components/DataSourceItem.tsx`: tooltip content shows `dataSource.url` (falling back to the untruncated display name, e.g. WMS layer names or sources without a URL). Keep `max-w-xs break-all` so long URLs wrap.
- Update `DataSourceItem.displayName.test.tsx`: tooltip assertions expect the full URL instead of the item ID.

No schema or data changes. Focused test + typecheck only; visual check left to you.
