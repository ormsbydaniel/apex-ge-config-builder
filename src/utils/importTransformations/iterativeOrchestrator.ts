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
    
    // Apply swipe layer transformation with enhanced debugging
    if (detectedTransforms.transformSwipeLayersToData) {
      console.log(`Iteration ${iteration}: Applying swipeLayer transformation`);
      const beforeSwipe = currentConfig.sources?.find((s: any) => s.name === 'Sentinel-2 RGB vs WorldCover (2020)');
      console.log(`Iteration ${iteration}: Swipe layer before transform:`, {
        name: beforeSwipe?.name,
        dataType: beforeSwipe?.data?.type,
        metaKeys: beforeSwipe?.meta ? Object.keys(beforeSwipe.meta) : 'no meta',
        metaEmpty: beforeSwipe?.meta && Object.keys(beforeSwipe.meta).length === 0
      });
      
      currentConfig = reverseSwipeLayerTransformation(currentConfig, true);
      
      const afterSwipe = currentConfig.sources?.find((s: any) => s.name === 'Sentinel-2 RGB vs WorldCover (2020)');
      console.log(`Iteration ${iteration}: Swipe layer after transform:`, {
        name: afterSwipe?.name,
        dataIsArray: Array.isArray(afterSwipe?.data),
        hasSwipeConfig: !!afterSwipe?.meta?.swipeConfig,
        hasDescription: !!afterSwipe?.meta?.description,
        hasAttributionText: !!afterSwipe?.meta?.attribution?.text,
        metaKeys: afterSwipe?.meta ? Object.keys(afterSwipe.meta) : 'no meta'
      });
      
      transformationsApplied.push(`swipeLayer (iteration ${iteration})`);
      configChanged = true;
    }
    
    if (detectedTransforms.configureCogsAsImages) {
      console.log(`Iteration ${iteration}: Applying cog transformation`);
      currentConfig = reverseCogTransformation(currentConfig, true);
      transformationsApplied.push(`cog (iteration ${iteration})`);
      configChanged = true;
    }
    
    // Apply meta completion after structural transformations with enhanced validation
    if (detectedTransforms.metaCompletionNeeded) {
      console.log(`Iteration ${iteration}: Applying metaCompletion transformation`);
      const beforeMeta = currentConfig.sources?.find((s: any) => s.name === 'Sentinel-2 RGB vs WorldCover (2020)');
      console.log(`Iteration ${iteration}: Swipe layer before meta completion:`, {
        name: beforeMeta?.name,
        hasDescription: !!beforeMeta?.meta?.description,
        descriptionValue: beforeMeta?.meta?.description,
        hasAttributionText: !!beforeMeta?.meta?.attribution?.text,
        attributionTextValue: beforeMeta?.meta?.attribution?.text,
        hasSwipeConfig: !!beforeMeta?.meta?.swipeConfig
      });
      
      currentConfig = reverseMetaCompletionTransformation(currentConfig, true);
      
      const afterMeta = currentConfig.sources?.find((s: any) => s.name === 'Sentinel-2 RGB vs WorldCover (2020)');
      console.log(`Iteration ${iteration}: Swipe layer after meta completion:`, {
        name: afterMeta?.name,
        hasDescription: !!afterMeta?.meta?.description,
        descriptionValue: afterMeta?.meta?.description,
        hasAttributionText: !!afterMeta?.meta?.attribution?.text,
        attributionTextValue: afterMeta?.meta?.attribution?.text,
        hasSwipeConfig: !!afterMeta?.meta?.swipeConfig
      });
      
      transformationsApplied.push(`metaCompletion (iteration ${iteration})`);
      configChanged = true;
    }
    
    // Check if config actually changed to prevent infinite loops
    const currentConfigString = JSON.stringify(currentConfig);
    if (!configChanged || currentConfigString === previousConfig) {
      console.log(`Iteration ${iteration}: No actual changes made, stopping`);
      break;
    }
    
    // Enhanced debug for final state validation
    const swipeLayer = currentConfig.sources?.find((s: any) => s.name === 'Sentinel-2 RGB vs WorldCover (2020)');
    if (swipeLayer) {
      console.log(`Iteration ${iteration} complete. Swipe layer validation check:`, {
        name: swipeLayer.name,
        dataIsArray: Array.isArray(swipeLayer.data),
        dataEmpty: Array.isArray(swipeLayer.data) && swipeLayer.data.length === 0,
        hasValidMeta: !!(swipeLayer.meta?.description && swipeLayer.meta?.attribution?.text),
        hasSwipeConfig: !!swipeLayer.meta?.swipeConfig,
        metaComplete: {
          description: swipeLayer.meta?.description,
          attributionText: swipeLayer.meta?.attribution?.text,
          swipeConfig: swipeLayer.meta?.swipeConfig
        }
      });
    }
  }
  
  const success = iteration < MAX_ITERATIONS;
  
  console.log(`\n=== Final Results ===`);
  console.log(`Iterative transformation completed after ${iteration} iterations`);
  console.log('Transformations applied:', transformationsApplied);
  
  // Enhanced final validation for swipe layer
  const swipeLayer = currentConfig.sources?.find((s: any) => s.name === 'Sentinel-2 RGB vs WorldCover (2020)');
  if (swipeLayer) {
    const isValid = Array.isArray(swipeLayer.data) && 
                   swipeLayer.meta?.description && 
                   swipeLayer.meta?.attribution?.text &&
                   swipeLayer.meta?.swipeConfig;
    
    console.log('Final swipe layer validation:', {
      name: swipeLayer.name,
      isValid,
      validationDetails: {
        dataIsArray: Array.isArray(swipeLayer.data),
        hasDescription: !!swipeLayer.meta?.description,
        hasAttributionText: !!swipeLayer.meta?.attribution?.text,
        hasSwipeConfig: !!swipeLayer.meta?.swipeConfig,
        layout: !!swipeLayer.layout
      },
      finalMeta: swipeLayer.meta
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
