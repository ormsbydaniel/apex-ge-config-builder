
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

/**
 * Enhanced iterative orchestrator with deep transformation tracking
 */
export const normalizeImportedConfig = (config: any): any => {
  console.log('=== ITERATIVE ORCHESTRATOR START ===');
  console.log('Input config sources count:', config.sources?.length);
  
  let currentConfig = { ...config };
  let iteration = 0;
  const maxIterations = 10;
  
  while (iteration < maxIterations) {
    iteration++;
    console.log(`\n--- ITERATION ${iteration} ---`);
    
    // Detect what transformations are needed
    const detected = detectTransformations(currentConfig);
    console.log('Detected transformations:', detected);
    
    // Track swipe layers specifically
    const swipeLayers = currentConfig.sources?.filter((s: any) => 
      s.data && !Array.isArray(s.data) && typeof s.data === 'object' && s.data.type === 'swipe'
    ) || [];
    console.log(`Found ${swipeLayers.length} swipe layers to transform:`, 
      swipeLayers.map((s: any) => s.name));
    
    // Check if any transformations are needed
    const hasTransformations = Object.values(detected).some(Boolean);
    if (!hasTransformations) {
      console.log('No transformations needed, stopping iteration');
      break;
    }
    
    let configChanged = false;
    const previousConfig = JSON.stringify(currentConfig);
    
    // Apply transformations in order
    if (detected.typeToFormatConversion) {
      console.log('Applying typeToFormatConversion...');
      const beforeCount = currentConfig.sources?.filter((s: any) => s.data?.some?.((d: any) => d.type)).length || 0;
      currentConfig = reverseTypeToFormatTransformation(currentConfig, true);
      const afterCount = currentConfig.sources?.filter((s: any) => s.data?.some?.((d: any) => d.type)).length || 0;
      console.log(`TypeToFormat: ${beforeCount} sources with type before, ${afterCount} after`);
    }
    
    if (detected.singleItemArrayToObject) {
      console.log('Applying singleItemArrayToObject...');
      currentConfig = reverseSingleItemTransformation(currentConfig, true);
    }
    
    if (detected.baseLayerFormat) {
      console.log('Applying baseLayerFormat...');
      currentConfig = reverseBaseLayerTransformation(currentConfig, true);
    }
    
    if (detected.transformSwipeLayersToData) {
      console.log('🔍 SWIPE TRANSFORMATION DEBUG: Starting swipe layer transformation...');
      console.log('🔍 SWIPE TRANSFORMATION DEBUG: Current config before transformation:', JSON.stringify(currentConfig, null, 2));
      
      const beforeSwipeCount = currentConfig.sources?.filter((s: any) => 
        s.data && !Array.isArray(s.data) && typeof s.data === 'object' && s.data.type === 'swipe'
      ).length || 0;
      
      console.log(`🔍 SWIPE TRANSFORMATION DEBUG: Found ${beforeSwipeCount} swipe layers before transformation`);
      
      // Deep clone to ensure we can track changes
      const beforeTransform = JSON.parse(JSON.stringify(currentConfig));
      
      currentConfig = reverseSwipeLayerTransformation(currentConfig, true);
      
      // Validate transformation occurred
      const afterTransform = JSON.stringify(currentConfig);
      const transformationOccurred = JSON.stringify(beforeTransform) !== afterTransform;
      console.log(`🔍 SWIPE TRANSFORMATION DEBUG: Transformation occurred: ${transformationOccurred}`);
      
      const afterSwipeCount = currentConfig.sources?.filter((s: any) => 
        s.data && !Array.isArray(s.data) && typeof s.data === 'object' && s.data.type === 'swipe'
      ).length || 0;
      
      const transformedSwipeCount = currentConfig.sources?.filter((s: any) => 
        s.meta?.swipeConfig && Array.isArray(s.data)
      ).length || 0;
      
      console.log(`🔍 SWIPE TRANSFORMATION DEBUG: ${beforeSwipeCount} swipe layers before, ${afterSwipeCount} still untransformed, ${transformedSwipeCount} properly transformed`);
      
      // Validate specific swipe layer
      const sentinelLayer = currentConfig.sources?.find((s: any) => s.name === "Sentinel-2 RGB vs WorldCover (2020)");
      if (sentinelLayer) {
        console.log('🔍 SWIPE TRANSFORMATION DEBUG: Sentinel layer state after transformation:', {
          name: sentinelLayer.name,
          dataIsArray: Array.isArray(sentinelLayer.data),
          dataContent: sentinelLayer.data,
          hasSwipeConfig: !!sentinelLayer.meta?.swipeConfig,
          swipeConfig: sentinelLayer.meta?.swipeConfig,
          completeMeta: sentinelLayer.meta,
          transformationSuccess: Array.isArray(sentinelLayer.data) && !!sentinelLayer.meta?.swipeConfig
        });
        
        // Extra validation
        if (!Array.isArray(sentinelLayer.data)) {
          console.error('🚨 SWIPE TRANSFORMATION ERROR: Sentinel layer data is not an array after transformation!');
        }
        if (!sentinelLayer.meta?.swipeConfig) {
          console.error('🚨 SWIPE TRANSFORMATION ERROR: Sentinel layer missing swipeConfig after transformation!');
        }
      } else {
        console.error('🚨 SWIPE TRANSFORMATION ERROR: Could not find Sentinel layer after transformation!');
      }
    }
    
    if (detected.configureCogsAsImages) {
      console.log('Applying cogTransformation...');
      currentConfig = reverseCogTransformation(currentConfig, true);
    }
    
    if (detected.exclusivitySetsTransformation) {
      console.log('Applying exclusivitySetsTransformation...');
      currentConfig = reverseExclusivitySetsTransformation(currentConfig, true);
    }
    
    if (detected.metaCompletionNeeded) {
      console.log('Applying metaCompletionTransformation...');
      currentConfig = reverseMetaCompletionTransformation(currentConfig, true);
    }
    
    // Check if config actually changed
    const currentConfigString = JSON.stringify(currentConfig);
    configChanged = previousConfig !== currentConfigString;
    
    console.log(`Iteration ${iteration} complete, config changed: ${configChanged}`);
    
    if (!configChanged) {
      console.log('No changes made in this iteration, stopping');
      break;
    }
  }
  
  console.log(`=== ITERATIVE ORCHESTRATOR COMPLETE (${iteration} iterations) ===`);
  
  // Final validation
  const finalSwipeLayers = currentConfig.sources?.filter((s: any) => 
    s.meta?.swipeConfig && Array.isArray(s.data)
  ) || [];
  console.log(`Final result: ${finalSwipeLayers.length} properly transformed swipe layers`);
  
  const sentinelFinal = currentConfig.sources?.find((s: any) => s.name === "Sentinel-2 RGB vs WorldCover (2020)");
  if (sentinelFinal) {
    console.log('🏁 FINAL STATE: Sentinel layer state:', {
      name: sentinelFinal.name,
      dataIsArray: Array.isArray(sentinelFinal.data),
      hasSwipeConfig: !!sentinelFinal.meta?.swipeConfig,
      hasRequiredMeta: !!(sentinelFinal.meta?.description && sentinelFinal.meta?.attribution?.text),
      finalValidationPassed: Array.isArray(sentinelFinal.data) && !!sentinelFinal.meta?.swipeConfig && !!sentinelFinal.meta?.description && !!sentinelFinal.meta?.attribution?.text
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
      transformationsApplied: [] // TODO: track actual transformations
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
