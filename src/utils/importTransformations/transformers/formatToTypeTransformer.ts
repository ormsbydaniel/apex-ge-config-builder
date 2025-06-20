
import { processSourceArrays } from '../utils/sourceHelpers';

/**
 * Convert type fields back to format fields
 */
export const reverseFormatToTypeTransformation = (config: any, enabled: boolean): any => {
  if (!enabled) return config;

  console.log('FormatToType transformer: Converting type fields back to format fields');
  const normalizedConfig = { ...config };
  
  if (normalizedConfig.sources && Array.isArray(normalizedConfig.sources)) {
    normalizedConfig.sources = normalizedConfig.sources.map((source: any) => {
      // Special handling for swipe layers - preserve their structure
      if (source.data && typeof source.data === 'object' && !Array.isArray(source.data) && source.data.type === 'swipe') {
        console.log(`FormatToType transformer: Preserving swipe layer structure for "${source.name}"`);
        return source;
      }
      
      // Handle single data object (from other transformations)
      if (source.data && typeof source.data === 'object' && !Array.isArray(source.data)) {
        if (source.data.type && !source.data.format) {
          console.log(`FormatToType transformer: Converting type "${source.data.type}" to format for source "${source.name}"`);
          const { type, ...dataWithoutType } = source.data;
          return {
            ...source,
            data: {
              ...dataWithoutType,
              format: type
            }
          };
        }
        return source;
      }
      
      const convertTypeToFormat = (items: any[]): any[] => {
        return items.map(item => {
          if (item && item.type && !item.format) {
            console.log(`FormatToType transformer: Converting type "${item.type}" to format for source "${source.name}"`);
            const { type, ...itemWithoutType } = item;
            const convertedItem = {
              ...itemWithoutType,
              format: type
            };
            console.log(`FormatToType transformer: Converted item:`, {
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
