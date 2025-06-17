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
    firstSourceStructure: currentConfig.sources?.[0] ? {
      name: currentConfig.sources[0].name,
      hasData: !!currentConfig.sources[0].data,
      dataIsArray: Array.isArray(currentConfig.sources[0].data),
      dataStructure: currentConfig.sources[0].data
    } : 'No sources'
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
    
    // Apply transformations in logical order - meta completion should come after structural changes
    if (detectedTransforms.exclusivitySetsTransformation) {
      console.log(`Iteration ${iteration}: Applying exclusivitySets transformation`);
      const beforeTransform = JSON.parse(JSON.stringify(currentConfig));
      currentConfig = reverseExclusivitySetsTransformation(currentConfig, true);
      console.log(`Iteration ${iteration}: ExclusivitySets transform complete. Sample data item:`, 
        currentConfig.sources?.[1]?.data?.[0] || 'No data');
      transformationsApplied.push(`exclusivitySets (iteration ${iteration})`);
      configChanged = true;
    }
    
    if (detectedTransforms.singleItemArrayToObject) {
      console.log(`Iteration ${iteration}: Applying singleItem transformation`);
      const beforeTransform = JSON.parse(JSON.stringify(currentConfig));
      currentConfig = reverseSingleItemTransformation(currentConfig, true);
      console.log(`Iteration ${iteration}: SingleItem transform complete. Sample data:`, 
        currentConfig.sources?.[1]?.data || 'No data');
      transformationsApplied.push(`singleItem (iteration ${iteration})`);
      configChanged = true;
    }
    
    if (detectedTransforms.typeToFormatConversion) {
      console.log(`Iteration ${iteration}: Applying typeToFormat transformation`);
      const beforeTransform = JSON.parse(JSON.stringify(currentConfig));
      currentConfig = reverseTypeToFormatTransformation(currentConfig, true);
      console.log(`Iteration ${iteration}: TypeToFormat transform complete. Sample data item:`, 
        currentConfig.sources?.[1]?.data?.[0] || 'No data');
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
    
    // Apply meta completion after structural transformations
    if (detectedTransforms.metaCompletionNeeded) {
      console.log(`Iteration ${iteration}: Applying metaCompletion transformation`);
      currentConfig = reverseMetaCompletionTransformation(currentConfig, true);
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
    console.log(`Iteration ${iteration} complete. Current state:`, {
      sourcesCount: currentConfig.sources?.length || 0,
      geoServiceData: currentConfig.sources?.find((s: any) => s.name === 'Geo Service - Labels')?.data || 'Not found',
      geoServiceExclusivitySets: currentConfig.sources?.find((s: any) => s.name === 'Geo Service - Labels')?.exclusivitySets || 'Not found'
    });
  }
  
  const success = iteration < MAX_ITERATIONS;
  
  console.log(`\n=== Final Results ===`);
  console.log(`Iterative transformation completed after ${iteration} iterations`);
  console.log('Transformations applied:', transformationsApplied);
  
  // Final validation debug
  const geoServiceSource = currentConfig.sources?.find((s: any) => s.name === 'Geo Service - Labels');
  if (geoServiceSource) {
    console.log('Final GeoService config:', {
      name: geoServiceSource.name,
      data: geoServiceSource.data,
      dataIsArray: Array.isArray(geoServiceSource.data),
      dataLength: geoServiceSource.data?.length,
      firstDataItem: geoServiceSource.data?.[0],
      meta: geoServiceSource.meta,
      layout: geoServiceSource.layout
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
