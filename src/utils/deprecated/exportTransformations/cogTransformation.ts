
import { processSourceArrays } from '../../importTransformations/utils/sourceHelpers';

/**
 * @deprecated This transformation is no longer needed as the viewer handles both COG formats.
 * Preserved for potential future use. See src/utils/deprecated/exportTransformations/README.md
 * 
 * Consolidates multiple COG items into a single item with an images array.
 */
export const transformCogsAsImages = (config: any, enabled: boolean): any => {
  if (!enabled) return config;

  console.log('Starting COG consolidation transformation...');
  const transformedConfig = { ...config };
  
  if (transformedConfig.sources) {
    transformedConfig.sources = transformedConfig.sources.map((source: any) => {
      const consolidateCogItems = (items: any[]): any[] => {
        const cogItems: any[] = [];
        const nonCogItems: any[] = [];
        
        // Separate COG and non-COG items
        for (const item of items) {
          if (item.format === 'cog') {
            cogItems.push(item);
          } else {
            nonCogItems.push(item);
          }
        }
        
        // If we have COG items, consolidate them
        if (cogItems.length > 0) {
          console.log(`Found ${cogItems.length} COG items to consolidate`);
          
          // Take the first COG item as the base
          const baseCog = { ...cogItems[0] };
          
          // Create images array from all COG items
          const images = cogItems.map(cog => ({
            url: cog.url,
            zIndex: cog.zIndex
          }));
          
          // Find the maximum zIndex
          const maxZIndex = Math.max(...images.map(img => img.zIndex || 0));
          
          // Create consolidated COG object
          const consolidatedCog = {
            ...baseCog,
            images,
            zIndex: maxZIndex,
            // Remove the url since we're using images array
            url: undefined
          };
          
          // Return consolidated COG followed by non-COG items
          return [consolidatedCog, ...nonCogItems];
        }
        
        return items;
      };
      
      return processSourceArrays(source, consolidateCogItems);
    });
  }
  
  console.log('COG consolidation transformation completed');
  return transformedConfig;
};
