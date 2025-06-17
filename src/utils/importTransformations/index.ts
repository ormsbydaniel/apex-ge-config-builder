
// Import the main functions from their modules
import { detectTransformations } from './detector';
import { reverseTransformations } from './orchestrator';
import { normalizeImportedConfig as iterativeNormalizeConfig, reverseTransformationsIterative } from './iterativeOrchestrator';

// Re-export the main public API to maintain backward compatibility
export { detectTransformations } from './detector';
export { reverseTransformations } from './orchestrator';
export { reverseTransformationsIterative, normalizeImportedConfig } from './iterativeOrchestrator';
export type { DetectedTransformations } from './types';

// Main entry point that combines detection and transformation with fallback
export const normalizeImportedConfig = (config: any): any => {
  console.log('Starting config normalization process');
  
  try {
    // Try the iterative approach first
    console.log('Attempting iterative transformation');
    const iterativeResult = reverseTransformationsIterative(config);
    
    if (iterativeResult.success) {
      console.log('Iterative transformation successful');
      console.log('Applied transformations:', iterativeResult.transformationsApplied);
      return iterativeResult.config;
    } else {
      console.warn('Iterative transformation failed, falling back to linear approach');
      const detectedTransforms = detectTransformations(config);
      console.log('Detected import transformations (fallback):', detectedTransforms);
      return reverseTransformations(config, detectedTransforms);
    }
  } catch (error) {
    console.error('Error during iterative transformation, falling back to linear approach:', error);
    const detectedTransforms = detectTransformations(config);
    console.log('Detected import transformations (fallback):', detectedTransforms);
    return reverseTransformations(config, detectedTransforms);
  }
};

// Re-export individual transformers for direct use if needed
export { reverseTypeToFormatTransformation } from './transformers/typeToFormatTransformer';
export { reverseBaseLayerTransformation } from './transformers/baseLayerTransformer';
export { reverseSwipeLayerTransformation } from './transformers/swipeLayerTransformer';
export { reverseCogTransformation } from './transformers/cogTransformer';
export { reverseSingleItemTransformation } from './transformers/singleItemTransformer';
export { reverseExclusivitySetsTransformation } from './transformers/exclusivitySetsTransformer';
export { reverseMetaCompletionTransformation } from './transformers/metaCompletionTransformer';
