
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
import { normalizeServices } from './transformers/serviceNormalizer';

/**
 * Enhanced iterative orchestrator with deep transformation tracking
 */
export const normalizeImportedConfig = (config: any): any => {
  let currentConfig = { ...config };
  let iteration = 0;
  const maxIterations = 10;

  // First, normalize services for backward compatibility
  currentConfig = normalizeServices(currentConfig);
  
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
    
    // Apply meta completion for sources missing attribution/description
    if (detected.metaCompletionNeeded) {
      currentConfig = reverseMetaCompletionTransformation(currentConfig, true);
    }
    
    // Preserve temporal fields
    currentConfig = preserveTemporalFields(currentConfig);
    
    // Check if configuration changed
    configChanged = JSON.stringify(currentConfig) !== previousConfig;
    if (!configChanged) {
      break;
    }
  }
  
  // FINAL CLEANUP: Remove empty layout/meta objects on base layers
  // This must happen AFTER all transformations to catch any empty objects they create
  if (currentConfig.sources && Array.isArray(currentConfig.sources)) {
    currentConfig.sources = currentConfig.sources.map((source: any) => {
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
