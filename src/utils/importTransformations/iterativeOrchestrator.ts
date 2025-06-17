
import { DetectedTransformations } from './types';
import { reverseTypeToFormatTransformation } from './transformers/typeToFormatTransformer';
import { reverseBaseLayerTransformation } from './transformers/baseLayerTransformer';
import { reverseSwipeLayerTransformation } from './transformers/swipeLayerTransformer';
import { reverseCogTransformation } from './transformers/cogTransformer';
import { reverseSingleItemTransformation } from './transformers/singleItemTransformer';
import { reverseExclusivitySetsTransformation } from './transformers/exclusivitySetsTransformer';
import { detectTransformations } from './detector';

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
  
  while (iteration < MAX_ITERATIONS) {
    iteration++;
    console.log(`Iteration ${iteration}: Detecting transformations`);
    
    const detectedTransforms = detectTransformations(currentConfig);
    const hasAnyTransformation = Object.values(detectedTransforms).some(Boolean);
    
    if (!hasAnyTransformation) {
      console.log(`Iteration ${iteration}: No more transformations needed`);
      break;
    }
    
    console.log(`Iteration ${iteration}: Detected transformations:`, detectedTransforms);
    let configChanged = false;
    const previousConfig = JSON.stringify(currentConfig);
    
    // Apply transformations in logical order
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
    
    if (detectedTransforms.transformSwipeLayersToData) {
      console.log(`Iteration ${iteration}: Applying swipeLayer transformation`);
      currentConfig = reverseSwipeLayerTransformation(currentConfig, true);
      transformationsApplied.push(`swipeLayer (iteration ${iteration})`);
      configChanged = true;
    }
    
    if (detectedTransforms.configureCogsAsImages) {
      console.log(`Iteration ${iteration}: Applying cog transformation`);
      currentConfig = reverseCogTransformation(currentConfig, true);
      transformationsApplied.push(`cog (iteration ${iteration})`);
      configChanged = true;
    }
    
    // Check if config actually changed to prevent infinite loops
    const currentConfigString = JSON.stringify(currentConfig);
    if (!configChanged || currentConfigString === previousConfig) {
      console.log(`Iteration ${iteration}: No actual changes made, stopping`);
      break;
    }
  }
  
  const success = iteration < MAX_ITERATIONS;
  
  console.log(`Iterative transformation completed after ${iteration} iterations`);
  console.log('Transformations applied:', transformationsApplied);
  
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
