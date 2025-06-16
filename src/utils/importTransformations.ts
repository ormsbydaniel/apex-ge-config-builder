import { DataSource, DataSourceItem } from '@/types/config';

interface DetectedTransformations {
  singleItemArrayToObject: boolean;
  configureCogsAsImages: boolean;
}

export const detectTransformations = (config: any): DetectedTransformations => {
  const detected: DetectedTransformations = {
    singleItemArrayToObject: false,
    configureCogsAsImages: false
  };
  
  // Check if export metadata exists
  if (config._exportMeta && Array.isArray(config._exportMeta.transformations)) {
    detected.singleItemArrayToObject = config._exportMeta.transformations.includes('singleItemArrayToObject');
    detected.configureCogsAsImages = config._exportMeta.transformations.includes('configureCogsAsImages');
    return detected;
  }
  
  // Fallback: detect by analyzing the data structure
  if (config.sources && Array.isArray(config.sources)) {
    for (const source of config.sources) {
      // Check if data is an object instead of array (indicating transformation was applied)
      if (source.data && !Array.isArray(source.data) && typeof source.data === 'object') {
        detected.singleItemArrayToObject = true;
      }
      
      // Check statistics field as well
      if (source.statistics && !Array.isArray(source.statistics) && typeof source.statistics === 'object') {
        detected.singleItemArrayToObject = true;
      }
      
      // Check for COG transformation: look for COG objects with images arrays instead of url
      const dataArray = Array.isArray(source.data) ? source.data : [source.data];
      for (const item of dataArray) {
        if (item && item.format === 'cog' && item.images && Array.isArray(item.images) && !item.url) {
          detected.configureCogsAsImages = true;
          break;
        }
      }
      
      // Check statistics for COG transformation as well
      if (source.statistics) {
        const statsArray = Array.isArray(source.statistics) ? source.statistics : [source.statistics];
        for (const item of statsArray) {
          if (item && item.format === 'cog' && item.images && Array.isArray(item.images) && !item.url) {
            detected.configureCogsAsImages = true;
            break;
          }
        }
      }
    }
  }
  
  return detected;
};

export const reverseCogTransformation = (config: any, enabled: boolean): any => {
  if (!enabled) return config;

  const normalizedConfig = { ...config };
  
  if (normalizedConfig.sources && Array.isArray(normalizedConfig.sources)) {
    normalizedConfig.sources = normalizedConfig.sources.map((source: any) => {
      const normalizedSource = { ...source };
      
      // Process main data array
      if (normalizedSource.data && Array.isArray(normalizedSource.data)) {
        const expandedData: any[] = [];
        
        for (const item of normalizedSource.data) {
          if (item.format === 'cog' && item.images && Array.isArray(item.images) && !item.url) {
            // This is a consolidated COG object, split it back into individual items
            for (const image of item.images) {
              if (image.url) {
                expandedData.push({
                  ...item,
                  url: image.url,
                  // Remove the images array since we're back to individual items
                  images: undefined
                });
              }
            }
          } else {
            // Keep non-COG items or regular COG items as-is
            expandedData.push(item);
          }
        }
        
        normalizedSource.data = expandedData;
      }
      
      // Process statistics array
      if (normalizedSource.statistics && Array.isArray(normalizedSource.statistics)) {
        const expandedStats: any[] = [];
        
        for (const item of normalizedSource.statistics) {
          if (item.format === 'cog' && item.images && Array.isArray(item.images) && !item.url) {
            // This is a consolidated COG object, split it back into individual items
            for (const image of item.images) {
              if (image.url) {
                expandedStats.push({
                  ...item,
                  url: image.url,
                  // Remove the images array since we're back to individual items
                  images: undefined
                });
              }
            }
          } else {
            // Keep non-COG items or regular COG items as-is
            expandedStats.push(item);
          }
        }
        
        normalizedSource.statistics = expandedStats;
      }
      
      return normalizedSource;
    });
  }
  
  return normalizedConfig;
};

export const reverseTransformations = (config: any, detectedTransforms: DetectedTransformations): any => {
  let normalizedConfig = { ...config };
  
  // Remove export metadata if it exists
  if (normalizedConfig._exportMeta) {
    delete normalizedConfig._exportMeta;
  }
  
  // Reverse COG transformation first (before single item array transformation)
  if (detectedTransforms.configureCogsAsImages) {
    normalizedConfig = reverseCogTransformation(normalizedConfig, true);
  }
  
  // Reverse single item object to array transformation
  if (detectedTransforms.singleItemArrayToObject) {
    if (normalizedConfig.sources && Array.isArray(normalizedConfig.sources)) {
      normalizedConfig.sources = normalizedConfig.sources.map((source: any) => {
        const normalizedSource = { ...source };
        
        // Convert data object back to array
        if (normalizedSource.data && !Array.isArray(normalizedSource.data) && typeof normalizedSource.data === 'object') {
          normalizedSource.data = [normalizedSource.data];
        }
        
        // Convert statistics object back to array
        if (normalizedSource.statistics && !Array.isArray(normalizedSource.statistics) && typeof normalizedSource.statistics === 'object') {
          normalizedSource.statistics = [normalizedSource.statistics];
        }
        
        return normalizedSource;
      });
    }
  }
  
  return normalizedConfig;
};

export const normalizeImportedConfig = (config: any): any => {
  const detectedTransforms = detectTransformations(config);
  return reverseTransformations(config, detectedTransforms);
};
