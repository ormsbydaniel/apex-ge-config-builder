
import { processSourceArrays } from '../utils/sourceHelpers';

/**
 * Convert type fields to format fields
 */
export const reverseTypeToFormatTransformation = (config: any, enabled: boolean): any => {
  if (!enabled) return config;

  console.log('TypeToFormat transformer: Converting type fields to format fields');
  const normalizedConfig = { ...config };
  
  if (normalizedConfig.sources && Array.isArray(normalizedConfig.sources)) {
    normalizedConfig.sources = normalizedConfig.sources.map((source: any) => {
      // Special handling for swipe layers - preserve their structure
      if (source.data && typeof source.data === 'object' && !Array.isArray(source.data) && source.data.type === 'swipe') {
        console.log(`TypeToFormat transformer: Preserving swipe layer structure for "${source.name}"`);
        console.log('TypeToFormat transformer: Swipe layer data before:', JSON.stringify(source.data, null, 2));
        
        // For swipe layers, we need to preserve the swipe-specific fields and not convert them
        // Only convert type to format in nested data structures if they exist
        const preservedSwipeData = { ...source.data };
        
        // Don't convert the main type field for swipe layers
        // Just preserve the entire structure as-is
        return {
          ...source,
          data: preservedSwipeData
        };
      }
      
      const convertTypeToFormat = (items: any[]): any[] => {
        return items.map(item => {
          if (item && item.type && !item.format) {
            console.log(`TypeToFormat transformer: Converting type "${item.type}" to format for source "${source.name}"`);
            const { type, ...itemWithoutType } = item;
            const convertedItem = {
              ...itemWithoutType,
              format: type
            };
            console.log(`TypeToFormat transformer: Converted item:`, {
              original: item,
              converted: convertedItem,
              hasFormat: !!convertedItem.format
            });
            return convertedItem;
          }
          return item;
        });
      };
      
      return processSourceArrays(source, convertTypeToFormat);
    });
  }
  
  return normalizedConfig;
};
