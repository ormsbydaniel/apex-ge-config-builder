

## S3 Layer Selector Layout Reorder

### Changes to `src/components/form/S3LayerSelector.tsx`

Reorder the sections within `<CardContent>` to this order:

1. Cached data indicator (unchanged)
2. **Search and Filter Controls** (moved up, before breadcrumbs)
3. **Breadcrumb navigation** (moved down, after search/filter)
4. Folder list (unchanged position relative to files)
5. Files list — make scrollable with `max-h-64 overflow-y-auto` (already has `max-h-96`, keep or adjust)
6. **Add All Objects button** (moved to after the file list)
7. Status text (unchanged)

This is a simple reorder of existing JSX blocks — no logic changes needed.

