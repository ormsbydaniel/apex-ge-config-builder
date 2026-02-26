
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
      // Base layers: only fix if they already have a meta object that's incomplete
      if (source.isBaseLayer === true) {
        if (source.meta && typeof source.meta === 'object') {
          const needsDescription = !source.meta.description;
          const needsAttribution = !source.meta.attribution || !source.meta.attribution.text || source.meta.attribution.text.trim() === '';
          
          if (needsDescription || needsAttribution) {
            console.log(`MetaCompletion transformer: Fixing base layer "${source.name}" meta at index ${index}`);
            return {
              ...source,
              meta: {
                ...source.meta,
                description: needsDescription
                  ? source.meta.description || `Base layer: ${source.name || 'unnamed'}`
                  : source.meta.description,
                attribution: {
                  text: needsAttribution
                    ? 'Data attribution not specified'
                    : source.meta.attribution.text,
                  ...(source.meta.attribution?.url && { url: source.meta.attribution.url })
                }
              }
            };
          }
        }
        // Base layer without meta or with complete meta - leave as-is
        return source;
      }

      // Enhanced handling for swipe layers
      const isSwipeLayer = source.meta?.swipeConfig !== undefined;
      if (isSwipeLayer) {
        console.log(`MetaCompletion transformer: Processing swipe layer "${source.name}" at index ${index}`);
        
        // Check what meta fields are missing or empty
        const needsDescription = !source.meta.description || source.meta.description.trim() === '';
        const needsAttribution = !source.meta.attribution?.text || source.meta.attribution.text.trim() === '';
        
        if (needsDescription || needsAttribution) {
          console.log(`MetaCompletion transformer: Swipe layer needs completion:`, {
            needsDescription,
            needsAttribution,
            currentDescription: source.meta.description,
            currentAttributionText: source.meta.attribution?.text
          });
          
          // Generate better descriptions for swipe layers
          const clippedSource = source.meta.swipeConfig.clippedSourceName;
          const baseSources = source.meta.swipeConfig.baseSourceNames || [];
          
          const updatedSource = {
            ...source,
            meta: {
              ...source.meta,
              description: needsDescription 
                ? `Swipe comparison between ${clippedSource} and ${baseSources.join(', ')}`
                : source.meta.description,
              attribution: {
                ...source.meta.attribution,
                text: needsAttribution 
                  ? `Swipe layer data comparison`
                  : source.meta.attribution.text
              }
            }
          };
          
          console.log(`MetaCompletion transformer: Enhanced swipe layer meta:`, {
            description: updatedSource.meta.description,
            attributionText: updatedSource.meta.attribution.text
          });
          return updatedSource;
        }
        
        return source;
      }

      // Check if this source has meta.description but missing attribution
      if (source.meta && typeof source.meta === 'object' && source.meta.description && 
          (!source.meta.attribution || !source.meta.attribution.text || source.meta.attribution.text.trim() === '')) {
        console.log(`MetaCompletion transformer: Adding missing attribution for source "${source.name}" at index ${index}`);
        
        const updatedSource = {
          ...source,
          meta: {
            ...source.meta,
            attribution: {
              text: 'Data attribution not specified',
              ...(source.meta.attribution?.url && { url: source.meta.attribution.url })
            }
          }
        };
        
        console.log(`MetaCompletion transformer: Added attribution:`, updatedSource.meta.attribution);
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
