/**
 * Deprecated Export Transformations
 * 
 * This module re-exports all deprecated export transformations.
 * These are preserved for potential future use but are no longer active in the export flow.
 * 
 * @deprecated All transformations in this module are deprecated as of November 2024.
 * See README.md in this directory for details.
 */

export { transformSingleItemArrays } from './singleItemTransformation';
export { transformCogsAsImages } from './cogTransformation';
export { transformSwipeLayersToData } from './swipeTransformation';
export { transformFormatToType, addNormalizeFalseToCogs } from './formatTransformation';
export { removeEmptyCategories, handleCategoryValues } from './cleanupTransformations';
