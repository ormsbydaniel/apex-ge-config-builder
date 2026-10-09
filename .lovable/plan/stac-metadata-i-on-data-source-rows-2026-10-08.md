# STAC metadata (i) on data source rows

## Proposal
Each STAC row on a layer card gets one (i) button, like COG, FlatGeobuf and WMS/WMTS rows already have. It opens a **STAC Metadata** dialog with three tabs, so you can see all three levels in one place:

1. **Collection**: title, description, licence, providers, spatial/temporal extent, keywords, item_assets summary, plus links (self, queryables if present). Collapsible raw JSON.
2. **Item**: for a single-item URL, that item. For an items endpoint, the first item returned by the saved query, with a note saying "first of N returned". Shows the ID, datetime, bbox, geometry type, key properties (e.g. eo:cloud_cover, platform, proj:epsg) and the full asset list, with the selected asset highlighted. Collapsible raw JSON.
3. **Asset**: the selected asset's STAC entry (href host only, type, roles, eo:bands/raster:bands), then the existing file inspector for its mapped format:
   - COG: the same content as the current COG Metadata dialog (bands, CRS, overviews, no-data)
   - FlatGeobuf: the same content as the current FlatGeobuf dialog
   - GeoJSON/CSV/other: a basic summary (size, content type) for now

The dialog opens on the **Asset** tab when an asset is mapped. Otherwise it opens on **Item**. Each tab loads the first time you open it, so nothing is fetched until you look.

## Behaviour rules
- Read-only. Nothing is saved, and the temporary or signed asset link is never written to the configuration. Shown links have signing parameters stripped.
- Collection URL is derived from the item/items URL (`.../collections/{id}`). If it can't be found, the Collection tab shows a clear "not available" message.
- Errors are shown per tab and don't block the other tabs.
- The tooltip on the row still shows the full saved URL.

## Technical details
- New `src/utils/stacMetadata.ts`: `getStacCollectionUrl(url)`, `fetchStacCollection`, `fetchStacItemSample` (reuses `getStacSample` cache / `resolveDataSourceInspectionAccess`).
- New `StacMetadataDialog.tsx` in `src/components/layers/components/`, with lazy tabs and a stale-response guard.
- To reuse the COG and FlatGeobuf inspectors inside a tab, pull their body content out into small embeddable views. The existing dialogs then wrap those views, so they behave the same as today.
- `DataSourceItem.tsx`: add the (i) button and dialog for `format === 'stac'`.
- Tests: collection-URL derivation, item vs items handling, asset tab picks the inspector by effective format, no resolved URL leaks into props passed to save.
- Docs: short section in `docs/data-sources/stac-browser.md`.

## Out of scope
Editing from the dialog, browsing beyond the first item, queryables UI (that's Phase 3).
