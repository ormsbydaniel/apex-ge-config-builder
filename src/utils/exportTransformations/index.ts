
import { ExportOptions } from '@/components/ExportOptionsDialog';
import { transformSingleItemArrays } from './singleItemTransformation';
import { transformCogsAsImages } from './cogTransformation';
import { transformSwipeLayersToData } from './swipeTransformation';
import { transformFormatToType, addNormalizeFalseToCogs } from './formatTransformation';
import { removeEmptyCategories, handleCategoryValues } from './cleanupTransformations';

interface ExportMetadata {
  version: string;
  transformations: string[];
  exportedAt: string;
}

export const applyExportTransformations = (config: any, options: ExportOptions): any => {
  let transformedConfig = { ...config };
  const appliedTransformations: string[] = [];
  
  console.log('Applying export transformations with options:', options);
  
  // Apply single item array to object transformation
  if (options.singleItemArrayToObject) {
    transformedConfig = transformSingleItemArrays(transformedConfig, true);
    appliedTransformations.push('singleItemArrayToObject');
  }
  
  // Apply COG consolidation transformation
  if (options.configureCogsAsImages) {
    transformedConfig = transformCogsAsImages(transformedConfig, true);
    appliedTransformations.push('configureCogsAsImages');
  }
  
  // Apply swipe layer transformation
  if (options.transformSwipeLayersToData) {
    transformedConfig = transformSwipeLayersToData(transformedConfig, true);
    appliedTransformations.push('transformSwipeLayersToData');
  }
  
  // Apply normalize false to COGs transformation (after COG consolidation)
  if (options.addNormalizeFalseToCogs) {
    transformedConfig = addNormalizeFalseToCogs(transformedConfig, true);
    appliedTransformations.push('addNormalizeFalseToCogs');
  }
  
  // Apply format to type transformation
  if (options.changeFormatToType) {
    transformedConfig = transformFormatToType(transformedConfig, true);
    appliedTransformations.push('changeFormatToType');
  }
  
  // Apply empty categories removal transformation
  if (options.removeEmptyCategories) {
    transformedConfig = removeEmptyCategories(transformedConfig, true);
    appliedTransformations.push('removeEmptyCategories');
  }
  
  // Handle category values (remove them if includeCategoryValues is false)
  transformedConfig = handleCategoryValues(transformedConfig, options.includeCategoryValues);
  if (!options.includeCategoryValues) {
    appliedTransformations.push('removeCategoryValues');
  }
  
  // Add export metadata
  const exportMetadata: ExportMetadata = {
    version: '1.0.0',
    transformations: appliedTransformations,
    exportedAt: new Date().toISOString()
  };
  
  // Only add metadata if transformations were applied
  if (appliedTransformations.length > 0) {
    transformedConfig._exportMeta = exportMetadata;
  }
  
  console.log('Final transformed config:', transformedConfig);
  return transformedConfig;
};

// Re-export individual transformations for potential direct use
export { transformSingleItemArrays } from './singleItemTransformation';
export { transformCogsAsImages } from './cogTransformation';
export { transformSwipeLayersToData } from './swipeTransformation';
export { transformFormatToType, addNormalizeFalseToCogs } from './formatTransformation';
export { removeEmptyCategories, handleCategoryValues } from './cleanupTransformations';
