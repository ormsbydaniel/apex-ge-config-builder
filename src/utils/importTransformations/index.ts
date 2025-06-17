
// Import the main functions from their modules
import { detectTransformations } from './detector';
import { reverseTransformations } from './orchestrator';

// Re-export the main public API to maintain backward compatibility
export { detectTransformations } from './detector';
export { reverseTransformations } from './orchestrator';
export type { DetectedTransformations } from './types';

// Main entry point that combines detection and transformation
export const normalizeImportedConfig = (config: any): any => {
  const detectedTransforms = detectTransformations(config);
  console.log('Detected import transformations:', detectedTransforms);
  return reverseTransformations(config, detectedTransforms);
};

// Re-export individual transformers for direct use if needed
export { reverseTypeToFormatTransformation } from './transformers/typeToFormatTransformer';
export { reverseBaseLayerTransformation } from './transformers/baseLayerTransformer';
export { reverseSwipeLayerTransformation } from './transformers/swipeLayerTransformer';
export { reverseCogTransformation } from './transformers/cogTransformer';
export { reverseSingleItemTransformation } from './transformers/singleItemTransformer';
