import { DetectedTransformations } from './types';
import { reverseTypeToFormatTransformation } from './transformers/typeToFormatTransformer';
import { reverseBaseLayerTransformation } from './transformers/baseLayerTransformer';
import { reverseSwipeLayerTransformation } from './transformers/swipeLayerTransformer';
import { reverseCogTransformation } from './transformers/cogTransformer';
import { reverseSingleItemTransformation } from './transformers/singleItemTransformer';
import { reverseExclusivitySetsTransformation } from './transformers/exclusivitySetsTransformer';
import { detectTransformations } from './detector';
import { reverseMetaCompletionTransformation } from './transformers/metaCompletionTransformer';

interface TransformationResult {
  config: any;
  iterations: number;
  transformationsApplied: string[];
  success: boolean;
}

const MAX_ITERATIONS = 10;

/**
 * Apply transformations iteratively until no more are needed
 */
export const reverseTransformationsIterative = (config: any): TransformationResult => {
  let currentConfig = { ...config };
  let iteration = 0;
  const transformationsApplied: string[] = [];
  
  // Remove export metadata if it exists
  if (currentConfig._exportMeta) {
    delete currentConfig._exportMeta;
  }
  
  console.log('Starting iterative transformation process');
  console.log('Initial config structure:', {
    hasSources: !!currentConfig.sources,
    sourcesCount: currentConfig.sources?.length || 0,
    swipeLayers: currentConfig.sources?.filter((s: any) => 
      s.data && typeof s.data === 'object' && s.data.type === 'swipe'
    ).map((s: any) => ({
      name: s.name,
      dataType: s.data.type,
      hasEmptyMeta: s.meta && Object.keys(s.meta).length === 0
    })) || []
  });
  
  while (iteration < MAX_ITERATIONS) {
    iteration++;
    console.log(`\n=== Iteration ${iteration} ===`);
    
    const detectedTransforms = detectTransformations(currentConfig);
    const hasAnyTransformation = Object.values(detectedTransforms).some(Boolean);
    
    console.log(`Iteration ${iteration}: Detected transformations:`, detectedTransforms);
    
    if (!hasAnyTransformation) {
      console.log(`Iteration ${iteration}: No more transformations needed`);
      break;
    }
    
    let configChanged = false;
    const previousConfig = JSON.stringify(currentConfig);
    
    // Apply structural transformations first
    if (detectedTransforms.exclusivitySetsTransformation) {
      console.log(`Iteration ${iteration}: Applying exclusivitySets transformation`);
      currentConfig = reverseExclusivitySetsTransformation(currentConfig, true);
      transformationsApplied.push(`exclusivitySets (iteration ${iteration})`);
      configChanged = true;
    }
    
    if (detectedTransforms.singleItemArrayToObject) {
      console.log(`Iteration ${iteration}: Applying singleItem transformation`);
      currentConfig = reverseSingleItemTransformation(currentConfig, true);
      transformationsApplied.push(`singleItem (iteration ${iteration})`);
      configChanged = true;
    }
    
    if (detectedTransforms.typeToFormatConversion) {
      console.log(`Iteration ${iteration}: Applying typeToFormat transformation`);
      currentConfig = reverseTypeToFormatTransformation(currentConfig, true);
      transformationsApplied.push(`typeToFormat (iteration ${iteration})`);
      configChanged = true;
    }
    
    if (detectedTransforms.baseLayerFormat) {
      console.log(`Iteration ${iteration}: Applying baseLayer transformation`);
      currentConfig = reverseBaseLayerTransformation(currentConfig, true);
      transformationsApplied.push(`baseLayer (iteration ${iteration})`);
      configChanged = true;
    }
    
    // Apply swipe layer transformation before meta completion
    if (detectedTransforms.transformSwipeLayersToData) {
      console.log(`Iteration ${iteration}: Applying swipeLayer transformation`);
      const beforeSwipe = currentConfig.sources?.find((s: any) => s.name === 'Sentinel-2 RGB vs WorldCover (2020)');
      console.log(`Iteration ${iteration}: Swipe layer before transform:`, beforeSwipe);
      
      currentConfig = reverseSwipeLayerTransformation(currentConfig, true);
      
      const afterSwipe = currentConfig.sources?.find((s: any) => s.name === 'Sentinel-2 RGB vs WorldCover (2020)');
      console.log(`Iteration ${iteration}: Swipe layer after transform:`, afterSwipe);
      
      transformationsApplied.push(`swipeLayer (iteration ${iteration})`);
      configChanged = true;
    }
    
    if (detectedTransforms.configureCogsAsImages) {
      console.log(`Iteration ${iteration}: Applying cog transformation`);
      currentConfig = reverseCogTransformation(currentConfig, true);
      transformationsApplied.push(`cog (iteration ${iteration})`);
      configChanged = true;
    }
    
    // Apply meta completion after structural transformations (especially after swipe layer transformation)
    if (detectedTransforms.metaCompletionNeeded) {
      console.log(`Iteration ${iteration}: Applying metaCompletion transformation`);
      const beforeMeta = currentConfig.sources?.find((s: any) => s.name === 'Sentinel-2 RGB vs WorldCover (2020)');
      console.log(`Iteration ${iteration}: Swipe layer before meta completion:`, beforeMeta);
      
      currentConfig = reverseMetaCompletionTransformation(currentConfig, true);
      
      const afterMeta = currentConfig.sources?.find((s: any) => s.name === 'Sentinel-2 RGB vs WorldCover (2020)');
      console.log(`Iteration ${iteration}: Swipe layer after meta completion:`, afterMeta);
      
      transformationsApplied.push(`metaCompletion (iteration ${iteration})`);
      configChanged = true;
    }
    
    // Check if config actually changed to prevent infinite loops
    const currentConfigString = JSON.stringify(currentConfig);
    if (!configChanged || currentConfigString === previousConfig) {
      console.log(`Iteration ${iteration}: No actual changes made, stopping`);
      break;
    }
    
    // Debug the current state after all transformations
    console.log(`Iteration ${iteration} complete. Swipe layer state:`, {
      swipeLayer: currentConfig.sources?.find((s: any) => s.name === 'Sentinel-2 RGB vs WorldCover (2020)')
    });
  }
  
  const success = iteration < MAX_ITERATIONS;
  
  console.log(`\n=== Final Results ===`);
  console.log(`Iterative transformation completed after ${iteration} iterations`);
  console.log('Transformations applied:', transformationsApplied);
  
  // Final validation debug for swipe layer
  const swipeLayer = currentConfig.sources?.find((s: any) => s.name === 'Sentinel-2 RGB vs WorldCover (2020)');
  if (swipeLayer) {
    console.log('Final swipe layer config:', {
      name: swipeLayer.name,
      data: swipeLayer.data,
      dataIsArray: Array.isArray(swipeLayer.data),
      meta: swipeLayer.meta,
      hasSwipeConfig: !!swipeLayer.meta?.swipeConfig,
      hasDescription: !!swipeLayer.meta?.description,
      hasAttribution: !!swipeLayer.meta?.attribution?.text,
      layout: swipeLayer.layout
    });
  }
  
  if (!success) {
    console.warn('Maximum iterations reached - potential infinite loop detected');
  }
  
  return {
    config: currentConfig,
    iterations: iteration,
    transformationsApplied,
    success
  };
};
