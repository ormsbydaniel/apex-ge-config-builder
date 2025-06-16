
import { DataSource, DataSourceItem } from '@/types/config';

interface DetectedTransformations {
  singleItemArrayToObject: boolean;
}

export const detectTransformations = (config: any): DetectedTransformations => {
  const detected: DetectedTransformations = {
    singleItemArrayToObject: false
  };
  
  // Check if export metadata exists
  if (config._exportMeta && Array.isArray(config._exportMeta.transformations)) {
    detected.singleItemArrayToObject = config._exportMeta.transformations.includes('singleItemArrayToObject');
    return detected;
  }
  
  // Fallback: detect by analyzing the data structure
  if (config.sources && Array.isArray(config.sources)) {
    for (const source of config.sources) {
      // Check if data is an object instead of array (indicating transformation was applied)
      if (source.data && !Array.isArray(source.data) && typeof source.data === 'object') {
        detected.singleItemArrayToObject = true;
        break;
      }
      
      // Check statistics field as well
      if (source.statistics && !Array.isArray(source.statistics) && typeof source.statistics === 'object') {
        detected.singleItemArrayToObject = true;
        break;
      }
    }
  }
  
  return detected;
};

export const reverseTransformations = (config: any, detectedTransforms: DetectedTransformations): any => {
  let normalizedConfig = { ...config };
  
  // Remove export metadata if it exists
  if (normalizedConfig._exportMeta) {
    delete normalizedConfig._exportMeta;
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
