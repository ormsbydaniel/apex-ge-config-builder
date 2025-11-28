
import { processSourceArrays } from '../../importTransformations/utils/sourceHelpers';

/**
 * @deprecated This transformation is no longer needed as the viewer handles both format and type fields.
 * Preserved for potential future use. See src/utils/deprecated/exportTransformations/README.md
 * 
 * Transforms format field to type field and adds normalize:false to COGs.
 */
export const transformFormatToType = (config: any, enabled: boolean): any => {
  if (!enabled) return config;

  console.log('Starting format to type transformation...');
  const transformedConfig = { ...config };
  
  if (transformedConfig.sources) {
    transformedConfig.sources = transformedConfig.sources.map((source: any) => {
      const transformFormatField = (items: any[]): any[] => {
        return items.map((item: any) => {
          if (item.format) {
            const { format, ...rest } = item;
            return {
              ...rest,
              type: format
            };
          }
          return item;
        });
      };
      
      return processSourceArrays(source, transformFormatField);
    });
  }
  
  console.log('Format to type transformation completed');
  return transformedConfig;
};

/**
 * @deprecated This transformation is no longer needed as the viewer's default behavior is appropriate.
 * Preserved for potential future use. See src/utils/deprecated/exportTransformations/README.md
 * 
 * Adds normalize:false to all COG items.
 */
export const addNormalizeFalseToCogs = (config: any, enabled: boolean): any => {
  if (!enabled) return config;

  console.log('Starting normalize false addition to COGs...');
  const transformedConfig = { ...config };
  
  if (transformedConfig.sources) {
    transformedConfig.sources = transformedConfig.sources.map((source: any) => {
      const addNormalizeFlag = (items: any[]): any[] => {
        return items.map((item: any) => {
          if (item.format === 'cog') {
            return {
              ...item,
              normalize: false
            };
          }
          return item;
        });
      };
      
      return processSourceArrays(source, addNormalizeFlag);
    });
  }
  
  console.log('Normalize false addition to COGs completed');
  return transformedConfig;
};
