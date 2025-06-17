
import { processSourceArrays } from '../utils/sourceHelpers';

/**
 * Convert type fields to format fields
 */
export const reverseTypeToFormatTransformation = (config: any, enabled: boolean): any => {
  if (!enabled) return config;

  console.log('Converting type fields to format fields');
  const normalizedConfig = { ...config };
  
  if (normalizedConfig.sources && Array.isArray(normalizedConfig.sources)) {
    normalizedConfig.sources = normalizedConfig.sources.map((source: any) => {
      const convertTypeToFormat = (items: any[]): any[] => {
        return items.map(item => {
          if (item && item.type && !item.format) {
            const { type, ...itemWithoutType } = item;
            return {
              ...itemWithoutType,
              format: type
            };
          }
          return item;
        });
      };
      
      return processSourceArrays(source, convertTypeToFormat);
    });
  }
  
  return normalizedConfig;
};
