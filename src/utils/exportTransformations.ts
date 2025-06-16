
import { DataSource, DataSourceItem } from '@/types/config';
import { ExportOptions } from '@/components/ExportOptionsDialog';

interface ExportMetadata {
  version: string;
  transformations: string[];
  exportedAt: string;
}

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

export const applyExportTransformations = (config: any, options: ExportOptions): any => {
  let transformedConfig = { ...config };
  const appliedTransformations: string[] = [];
  
  // Apply single item array to object transformation
  if (options.singleItemArrayToObject) {
    transformedConfig = transformSingleItemArrays(transformedConfig, true);
    appliedTransformations.push('singleItemArrayToObject');
  }
  
  // Add export metadata
  const exportMetadata: ExportMetadata = {
    version: '1.0.0',
    transformations: appliedTransformations,
    exportedAt: new Date().toISOString()
  };
  
  // Only add metadata if transformations were applied
  if (appliedTransformations.length > 0) {
    transformedConfig._exportMeta = exportMetadata;
  }
  
  return transformedConfig;
};
