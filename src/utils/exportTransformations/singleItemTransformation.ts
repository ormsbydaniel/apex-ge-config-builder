
import { DataSource } from '@/types/config';

export const transformSingleItemArrays = (config: any, enabled: boolean): any => {
  if (!enabled) return config;

  const transformedConfig = { ...config };
  
  // Transform sources
  if (transformedConfig.sources) {
    transformedConfig.sources = transformedConfig.sources.map((source: DataSource) => {
      const transformedSource = { ...source };
      
      // Transform main data array if it has only one item
      if (transformedSource.data && Array.isArray(transformedSource.data) && transformedSource.data.length === 1) {
        // Create a new object without the data array, then add data as single object
        const { data, ...rest } = transformedSource;
        return {
          ...rest,
          data: data[0] // This transforms the exported format, not the internal type
        };
      }
      
      // Transform statistics array if it exists and has only one item
      if (transformedSource.statistics && Array.isArray(transformedSource.statistics) && transformedSource.statistics.length === 1) {
        // Apply transformation to statistics as well
        const { statistics, ...rest } = transformedSource;
        return {
          ...rest,
          statistics: statistics[0]
        };
      }
      
      return transformedSource;
    });
  }
  
  return transformedConfig;
};
