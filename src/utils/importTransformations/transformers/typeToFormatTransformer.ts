
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
