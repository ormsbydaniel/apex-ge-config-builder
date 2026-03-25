

## Context-Aware Format Filtering for S3 Browser

### Problem
The S3 browser treats all formats the same regardless of context. The supported formats differ by source type:
- **Data Sources**: COG, GeoJSON, FlatGeoBuf — but NOT CSV
- **Charts**: CSV only
- **Constraints**: COG only
- **Statistics**: FlatGeoBuf and GeoJSON only

### Approach
Thread an `allowedFormats` prop through the S3 selection chain so each context filters appropriately.

### Changes

**1. `src/types/format.ts`** — Add `'csv'` to `DataSourceFormat` union.

**2. `src/constants/formats.ts`** — Add `csv` entry to `FORMAT_CONFIGS`.

**3. `src/utils/s3Utils.ts`** — Add `.csv` to the extension map in `getFormatFromExtension`.

**4. `src/components/form/S3LayerSelector.tsx`** — Add optional `allowedFormats?: string[]` prop. When provided, use it to determine supported files (styling, format dropdown, Select button, Add All). When absent, behave as today.

**5. `src/components/layers/components/ServiceSelectionModals.tsx`** — Add `allowedFormats?: string[]` to props, pass through to `S3LayerSelector`.

**6. `src/components/layers/DataSourceForm.tsx`** — Pass `allowedFormats={['cog', 'geojson', 'flatgeobuf']}`.

**7. `src/components/layers/components/ChartSourceForm.tsx`** — Pass `allowedFormats={['csv']}`.

**8. `src/components/layers/components/ConstraintSourceForm.tsx`** — Pass `allowedFormats={['cog']}`.

**9. Statistics source path** — Pass `allowedFormats={['flatgeobuf', 'geojson']}` (need to verify which component handles statistics S3 selection).

**10. `src/schemas/configSchema.ts`** — Add `'csv'` to format enum if needed.

