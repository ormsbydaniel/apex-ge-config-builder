
import { detectTransformations } from './detector';
import { DetectedTransformations } from './types';

// Import all transformers with correct function names
import { reverseTypeToFormatTransformation } from './transformers/typeToFormatTransformer';
import { reverseSingleItemTransformation } from './transformers/singleItemTransformer';
import { reverseBaseLayerTransformation } from './transformers/baseLayerTransformer';
import { reverseSwipeLayerTransformation } from './transformers/swipeLayerTransformer';
import { reverseCogTransformation } from './transformers/cogTransformer';
import { reverseExclusivitySetsTransformation } from './transformers/exclusivitySetsTransformer';
import { reverseMetaCompletionTransformation } from './transformers/metaCompletionTransformer';
import { preserveTemporalFields } from './transformers/temporalTransformer';

/**
 * Enhanced iterative orchestrator with deep transformation tracking
 */
export const normalizeImportedConfig = (config: any): any => {
  let currentConfig = { ...config };
  let iteration = 0;
  const maxIterations = 10;
  
  while (iteration < maxIterations) {
    iteration++;
    
    // Detect what transformations are needed
    const detected = detectTransformations(currentConfig);
    
    // Track swipe layers specifically
    const swipeLayers = currentConfig.sources?.filter((s: any) => 
      s.data && !Array.isArray(s.data) && typeof s.data === 'object' && s.data.type === 'swipe'
    ) || [];
    
    // Check if any transformations are needed
    const hasTransformations = Object.values(detected).some(Boolean);
    if (!hasTransformations) {
      break;
    }
    
    let configChanged = false;
    const previousConfig = JSON.stringify(currentConfig);
    
    // Apply transformations in order
    if (detected.typeToFormatConversion) {
      currentConfig = reverseTypeToFormatTransformation(currentConfig, true);
    }
    
    if (detected.singleItemArrayToObject) {
      currentConfig = reverseSingleItemTransformation(currentConfig, true);
    }
    
    if (detected.baseLayerFormat) {
      currentConfig = reverseBaseLayerTransformation(currentConfig, true);
    }
    
    if (detected.transformSwipeLayersToData) {
      currentConfig = reverseSwipeLayerTransformation(currentConfig, true);
    }
    
    // Preserve temporal fields
    currentConfig = preserveTemporalFields(currentConfig);
    
    // Check if configuration changed
    configChanged = JSON.stringify(currentConfig) !== previousConfig;
    if (!configChanged) {
      break;
    }
  }
  
  return currentConfig;
};

// Export for backward compatibility
export const reverseTransformationsIterative = (config: any) => {
  try {
    const result = normalizeImportedConfig(config);
    return {
      success: true,
      config: result,
      transformationsApplied: []
    };
  } catch (error) {
    console.error('Iterative transformation failed:', error);
    return {
      success: false,
      error: error,
      config: config
    };
  }
};
