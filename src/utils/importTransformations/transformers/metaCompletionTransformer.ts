
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

      // Check if this source has meta but is missing description
      if (source.meta && typeof source.meta === 'object' && !source.meta.description) {
        console.log(`MetaCompletion transformer: Adding missing description for source "${source.name}" at index ${index}`);
        
        const updatedSource = {
          ...source,
          meta: {
            ...source.meta,
            description: `Auto-generated description for ${source.name}` // Default description
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
      
      return source;
    });
  }
  
  return normalizedConfig;
};
