# Deprecated Export Transformations

**Deprecation Date:** November 2024

## Purpose

This folder contains legacy export transformations that were used for backward compatibility with older viewer versions. These transformations are no longer needed as the viewer now handles all these formats natively through import transformations.

## Why Deprecated?

The application now uses a **bidirectional transformation approach**:
- **Import transformations**: Convert old formats to the new internal format when loading configs
- **Export transformations**: Simply export the internal format as-is

This approach is more maintainable and eliminates the need for backward compatibility transformations at export time.

## Deprecated Transformations

The following transformations are preserved here but no longer in active use:

1. **singleItemTransformation.ts** - Converted single-item arrays to objects
2. **cogTransformation.ts** - Consolidated COG layers into image arrays
3. **swipeTransformation.ts** - Transformed swipe layers to data format
4. **formatTransformation.ts** - Converted format field to type field
5. **cleanupTransformations.ts** - Removed empty categories and category values

## Restoration

If you need to restore these transformations:

1. Copy the needed file(s) back to `src/utils/exportTransformations/`
2. Import and use in `src/utils/exportTransformations/index.ts`
3. Add corresponding options back to `ExportOptions` interface
4. Update `ExportOptionsDialog.tsx` to include the UI controls

## Note

All corresponding **import** transformations remain active and functional in `src/utils/importTransformations/` to ensure the viewer can still read older config formats.
