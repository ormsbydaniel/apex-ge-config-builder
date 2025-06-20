
import { DetectedTransformations } from './types';
import { reverseTypeToFormatTransformation } from './transformers/typeToFormatTransformer';
import { reverseBaseLayerTransformation } from './transformers/baseLayerTransformer';
import { reverseSwipeLayerTransformation } from './transformers/swipeLayerTransformer';
import { reverseCogTransformation } from './transformers/cogTransformer';
import { reverseSingleItemTransformation } from './transformers/singleItemTransformer';
import { reverseExclusivitySetsTransformation } from './transformers/exclusivitySetsTransformer';
import { reverseFormatToTypeTransformation } from './transformers/formatToTypeTransformer';

/**
 * Apply all reverse transformations in the correct order
 */
export const reverseTransformations = (config: any, detectedTransforms: DetectedTransformations): any => {
  let normalizedConfig = { ...config };
  
  // Remove export metadata if it exists
  if (normalizedConfig._exportMeta) {
    delete normalizedConfig._exportMeta;
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
  
  // 6. Reverse swipe layer transformation (data object → internal format)
  if (detectedTransforms.transformSwipeLayersToData) {
    normalizedConfig = reverseSwipeLayerTransformation(normalizedConfig, true);
  }
  
  // 7. Reverse COG transformation (after other transformations)
  if (detectedTransforms.configureCogsAsImages) {
    normalizedConfig = reverseCogTransformation(normalizedConfig, true);
  }
  
  return normalizedConfig;
};
