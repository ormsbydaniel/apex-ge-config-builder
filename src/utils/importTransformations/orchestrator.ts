
import { DetectedTransformations } from './types';
import { reverseTypeToFormatTransformation } from './transformers/typeToFormatTransformer';
import { reverseBaseLayerTransformation } from './transformers/baseLayerTransformer';
import { transformBaseLayerPreview } from './transformers/baseLayerPreviewTransformer';
import { reverseSwipeLayerTransformation } from './transformers/swipeLayerTransformer';
import { reverseCogTransformation } from './transformers/cogTransformer';
import { reverseSingleItemTransformation } from './transformers/singleItemTransformer';
import { reverseExclusivitySetsTransformation } from './transformers/exclusivitySetsTransformer';
import { reverseFormatToTypeTransformation } from './transformers/formatToTypeTransformer';
import { preserveTemporalFields } from './transformers/temporalTransformer';
import { normalizeServices } from './transformers/serviceNormalizer';

/**
 * Apply all reverse transformations in the correct order
 */
export const reverseTransformations = (config: any, detectedTransforms: DetectedTransformations): any => {
  let normalizedConfig = { ...config };
  
  // First, normalize services for backward compatibility
  normalizedConfig = normalizeServices(normalizedConfig);
  
  // Remove export metadata if it exists
  if (normalizedConfig._exportMeta) {
    delete normalizedConfig._exportMeta;
  }
  
  // Clean up empty layout/meta objects on base layers
  if (normalizedConfig.sources && Array.isArray(normalizedConfig.sources)) {
    normalizedConfig.sources = normalizedConfig.sources.map((source: any) => {
      if (source.isBaseLayer === true) {
        const cleanedSource = { ...source };
        
        // Remove empty meta objects
        if (cleanedSource.meta && typeof cleanedSource.meta === 'object' && Object.keys(cleanedSource.meta).length === 0) {
          delete cleanedSource.meta;
        }
        
        // Remove empty layout objects
        if (cleanedSource.layout && typeof cleanedSource.layout === 'object' && Object.keys(cleanedSource.layout).length === 0) {
          delete cleanedSource.layout;
        }
        
        return cleanedSource;
      }
      return source;
    });
  }
  
  // Apply transformations in the correct order
  
  // 1. Move exclusivitySets from data items to source level FIRST
  if (detectedTransforms.exclusivitySetsTransformation) {
    normalizedConfig = reverseExclusivitySetsTransformation(normalizedConfig, true);
  }
  
  // 2. Reverse single item object to array transformation BEFORE type conversion
  if (detectedTransforms.singleItemArrayToObject) {
    normalizedConfig = reverseSingleItemTransformation(normalizedConfig, true);
  }
  
  // 3. Convert type to format fields (now that data is an array)
  if (detectedTransforms.typeToFormatConversion) {
    normalizedConfig = reverseTypeToFormatTransformation(normalizedConfig, true);
  }
  
  // 4. Convert format-to-type transformation back (type to format)
  if (detectedTransforms.formatToTypeConversion) {
    normalizedConfig = reverseFormatToTypeTransformation(normalizedConfig, true);
  }
  
  // 5. Reverse base layer transformation (old format → new format)
  if (detectedTransforms.baseLayerFormat) {
    normalizedConfig = reverseBaseLayerTransformation(normalizedConfig, true);
  }
  
  // 5b. Transform base layer preview from meta to top level
  if (detectedTransforms.baseLayerPreviewFormat) {
    normalizedConfig = transformBaseLayerPreview(normalizedConfig, true);
  }
  
  // 6. Reverse swipe layer transformation (data object → internal format)
  if (detectedTransforms.transformSwipeLayersToData) {
    normalizedConfig = reverseSwipeLayerTransformation(normalizedConfig, true);
  }
  
  // 7. Reverse COG transformation (after other transformations)
  if (detectedTransforms.configureCogsAsImages) {
    normalizedConfig = reverseCogTransformation(normalizedConfig, true);
  }
  
  // Always preserve temporal fields (timeframe and defaultTimestamp)
  normalizedConfig = preserveTemporalFields(normalizedConfig, true);
  
  return normalizedConfig;
};
