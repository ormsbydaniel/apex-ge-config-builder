
import { DataSource } from '@/types/config';

/**
 * @deprecated This transformation is no longer needed as the viewer handles swipe layers via meta.swipeConfig.
 * Preserved for potential future use. See src/utils/deprecated/exportTransformations/README.md
 * 
 * Transforms swipe layers from meta.swipeConfig to data object format.
 */
export const transformSwipeLayersToData = (config: any, enabled: boolean): any => {
  if (!enabled) return config;

  console.log('Starting swipe layer transformation...');
  const transformedConfig = { ...config };
  
  // Transform sources
  if (transformedConfig.sources) {
    transformedConfig.sources = transformedConfig.sources.map((source: DataSource) => {
      // Check if this is a swipe layer (has meta.swipeConfig)
      if (source.meta?.swipeConfig) {
        console.log(`Transforming swipe layer: ${source.name}`);
        
        const { swipeConfig } = source.meta;
        const { meta, ...sourceWithoutMeta } = source;
        const { swipeConfig: _, ...metaWithoutSwipeConfig } = meta;
        
        // Create the new data object format
        const swipeDataObject = {
          type: 'swipe',
          clippedSource: swipeConfig.clippedSourceName,
          baseSources: swipeConfig.baseSourceNames
        };
        
        return {
          ...sourceWithoutMeta,
          data: swipeDataObject,
          meta: metaWithoutSwipeConfig
        };
      }
      
      return source;
    });
  }
  
  console.log('Swipe layer transformation completed');
  return transformedConfig;
};
