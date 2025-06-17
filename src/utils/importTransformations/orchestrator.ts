
import { DetectedTransformations } from './types';
import { reverseTypeToFormatTransformation } from './transformers/typeToFormatTransformer';
import { reverseBaseLayerTransformation } from './transformers/baseLayerTransformer';
import { reverseSwipeLayerTransformation } from './transformers/swipeLayerTransformer';
import { reverseCogTransformation } from './transformers/cogTransformer';
import { reverseSingleItemTransformation } from './transformers/singleItemTransformer';

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
  
  // 1. Convert type to format fields first (before other transformations)
  if (detectedTransforms.typeToFormatConversion) {
    normalizedConfig = reverseTypeToFormatTransformation(normalizedConfig, true);
  }
  
  // 2. Reverse base layer transformation (old format → new format)
  if (detectedTransforms.baseLayerFormat) {
    normalizedConfig = reverseBaseLayerTransformation(normalizedConfig, true);
  }
  
  // 3. Reverse swipe layer transformation (data object → internal format)
  if (detectedTransforms.transformSwipeLayersToData) {
    normalizedConfig = reverseSwipeLayerTransformation(normalizedConfig, true);
  }
  
  // 4. Reverse COG transformation (before single item array transformation)
  if (detectedTransforms.configureCogsAsImages) {
    normalizedConfig = reverseCogTransformation(normalizedConfig, true);
  }
  
  // 5. Reverse single item object to array transformation
  if (detectedTransforms.singleItemArrayToObject) {
    normalizedConfig = reverseSingleItemTransformation(normalizedConfig, true);
  }
  
  return normalizedConfig;
};
