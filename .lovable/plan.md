

## Show "Bands: undefined" for Multi-Band COGs Without Configured Bands

### Change

**`src/components/layers/components/DataSourceItem.tsx`** (lines 164-169)

Replace the configured bands badge block with logic that also handles the case where a COG has multiple bands but no `bands` array is defined:

- If `dataSource.bands` is a non-empty array → show `"Bands: 1, 4, 3"` (existing behavior)
- Else if COG with `cogBandCount > 1` and no bands defined → show `"Bands: undefined"`
- Use a warning-style variant (e.g., `outline` or `destructive`) for the undefined case to draw attention

