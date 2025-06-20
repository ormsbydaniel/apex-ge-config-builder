
import { DataSource } from '@/types/config';

export const transformFormatToType = (config: any, enabled: boolean): any => {
  if (!enabled) return config;

  console.log('Starting format to type transformation...');
  const transformedConfig = { ...config };
  
  // Transform sources
  if (transformedConfig.sources) {
    transformedConfig.sources = transformedConfig.sources.map((source: DataSource) => {
      const transformedSource = { ...source };
      
      // Transform main data array/object
      if (transformedSource.data) {
        if (Array.isArray(transformedSource.data)) {
          transformedSource.data = transformedSource.data.map((item: any) => {
            if (item && typeof item === 'object' && 'format' in item && item.format) {
              const { format, ...itemWithoutFormat } = item;
              return {
                ...itemWithoutFormat,
                type: format
              };
            }
            return item;
          });
        } else if (transformedSource.data && typeof transformedSource.data === 'object' && 'format' in transformedSource.data) {
          // Handle single data object (from other transformations)
          const dataObj = transformedSource.data as any;
          if (dataObj.format) {
            const { format, ...dataWithoutFormat } = dataObj;
            transformedSource.data = {
              ...dataWithoutFormat,
              type: format
            };
          }
        }
      }
      
      // Transform statistics array if it exists
      if (transformedSource.statistics && Array.isArray(transformedSource.statistics)) {
        transformedSource.statistics = transformedSource.statistics.map((item: any) => {
          if (item && typeof item === 'object' && 'format' in item && item.format) {
            const { format, ...itemWithoutFormat } = item;
            return {
              ...itemWithoutFormat,
              type: format
            };
          }
          return item;
        });
      }
      
      return transformedSource;
    });
  }
  
  console.log('Format to type transformation completed');
  return transformedConfig;
};

export const addNormalizeFalseToCogs = (config: any, enabled: boolean): any => {
  if (!enabled) return config;

  console.log('Starting normalize false addition to COGs...');
  const transformedConfig = { ...config };
  
  // Transform sources
  if (transformedConfig.sources) {
    transformedConfig.sources = transformedConfig.sources.map((source: DataSource) => {
      const transformedSource = { ...source };
      
      // Transform main data array for COGs
      if (transformedSource.data && Array.isArray(transformedSource.data)) {
        transformedSource.data = transformedSource.data.map((item: any) => {
          // Check if it's a COG item (individual or consolidated)
          if (item.format === 'cog') {
            return {
              ...item,
              normalize: false
            };
          }
          return item;
        });
      }
      
      // Transform statistics array for COGs if it exists
      if (transformedSource.statistics && Array.isArray(transformedSource.statistics)) {
        transformedSource.statistics = transformedSource.statistics.map((item: any) => {
          // Check if it's a COG item (individual or consolidated)
          if (item.format === 'cog') {
            return {
              ...item,
              normalize: false
            };
          }
          return item;
        });
      }
      
      return transformedSource;
    });
  }
  
  console.log('Normalize false addition to COGs completed');
  return transformedConfig;
};
