import { processSourceArrays } from '../utils/sourceHelpers';

/**
 * Reverse COG transformation
 */
export const reverseCogTransformation = (config: any, enabled: boolean): any => {
  if (!enabled) return config;

  const normalizedConfig = { ...config };
  
  if (normalizedConfig.sources && Array.isArray(normalizedConfig.sources)) {
    normalizedConfig.sources = normalizedConfig.sources.map((source: any) => {
      const expandCogItems = (items: any[]): any[] => {
        const expandedItems: any[] = [];
        
        for (const item of items) {
          if (item.format === 'cog' && item.images && Array.isArray(item.images) && !item.url) {
            // This is a consolidated COG object, split it back into individual items
            for (const image of item.images) {
              if (image.url) {
                expandedItems.push({
                  ...item,
                  url: image.url,
                  // Remove the images array since we're back to individual items
                  images: undefined
                });
              }
            }
          } else {
            // Keep non-COG items or regular COG items as-is
            expandedItems.push(item);
          }
        }
        
        return expandedItems;
      };
      
      return processSourceArrays(source, expandCogItems);
    });
  }
  
  return normalizedConfig;
};
