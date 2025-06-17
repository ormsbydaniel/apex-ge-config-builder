
import { processSourceArrays } from '../utils/sourceHelpers';

/**
 * Add missing meta.description fields for layer cards that have other meta fields
 */
export const reverseMetaCompletionTransformation = (config: any, enabled: boolean): any => {
  if (!enabled) return config;

  console.log('MetaCompletion transformer: Adding missing meta.description fields');
  const normalizedConfig = { ...config };
  
  if (normalizedConfig.sources && Array.isArray(normalizedConfig.sources)) {
    normalizedConfig.sources = normalizedConfig.sources.map((source: any, index: number) => {
      // Skip base layers - they don't require meta.description
      if (source.isBaseLayer === true) {
        return source;
      }

      // Special handling for swipe layers
      const isSwipeLayer = source.meta?.swipeConfig !== undefined;
      if (isSwipeLayer) {
        console.log(`MetaCompletion transformer: Processing swipe layer "${source.name}" at index ${index}`);
        
        // Ensure swipe layers have complete meta
        const updatedSource = {
          ...source,
          meta: {
            ...source.meta,
            description: source.meta.description || `Swipe comparison layer for ${source.name}`,
            attribution: {
              text: source.meta.attribution?.text || 'Swipe layer data',
              ...(source.meta.attribution?.url && { url: source.meta.attribution.url })
            }
          }
        };
        
        console.log(`MetaCompletion transformer: Enhanced swipe layer meta:`, updatedSource.meta);
        return updatedSource;
      }

      // Check if this source has meta but is missing description
      if (source.meta && typeof source.meta === 'object' && !source.meta.description) {
        console.log(`MetaCompletion transformer: Adding missing description for source "${source.name}" at index ${index}`);
        
        const updatedSource = {
          ...source,
          meta: {
            ...source.meta,
            description: `Auto-generated description for ${source.name}`,
            attribution: {
              text: source.meta.attribution?.text || 'Data attribution not specified',
              ...(source.meta.attribution?.url && { url: source.meta.attribution.url })
            }
          }
        };
        
        console.log(`MetaCompletion transformer: Updated source meta:`, updatedSource.meta);
        return updatedSource;
      }

      // Check if this source has layout but no meta at all (layer card missing meta)
      if (source.layout && !source.meta && !source.isBaseLayer) {
        console.log(`MetaCompletion transformer: Adding complete meta object for source "${source.name}" at index ${index}`);
        
        const updatedSource = {
          ...source,
          meta: {
            description: `Auto-generated description for ${source.name}`,
            attribution: {
              text: 'Data attribution not specified'
            }
          }
        };
        
        console.log(`MetaCompletion transformer: Added complete meta:`, updatedSource.meta);
        return updatedSource;
      }

      // Check if source has empty meta object
      if (source.meta && typeof source.meta === 'object' && Object.keys(source.meta).length === 0) {
        console.log(`MetaCompletion transformer: Filling empty meta object for source "${source.name}" at index ${index}`);
        
        const updatedSource = {
          ...source,
          meta: {
            description: `Auto-generated description for ${source.name}`,
            attribution: {
              text: 'Data attribution not specified'
            }
          }
        };
        
        console.log(`MetaCompletion transformer: Filled empty meta:`, updatedSource.meta);
        return updatedSource;
      }
      
      return source;
    });
  }
  
  return normalizedConfig;
};
