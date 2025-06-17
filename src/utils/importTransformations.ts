import { DataSource, DataSourceItem } from '@/types/config';

interface DetectedTransformations {
  singleItemArrayToObject: boolean;
  configureCogsAsImages: boolean;
  transformSwipeLayersToData: boolean;
  baseLayerFormat: boolean;
  typeToFormatConversion: boolean; // NEW: Detect type → format conversion needed
}

export const detectTransformations = (config: any): DetectedTransformations => {
  const detected: DetectedTransformations = {
    singleItemArrayToObject: false,
    configureCogsAsImages: false,
    transformSwipeLayersToData: false,
    baseLayerFormat: false,
    typeToFormatConversion: false
  };
  
  // Check if export metadata exists
  if (config._exportMeta && Array.isArray(config._exportMeta.transformations)) {
    detected.singleItemArrayToObject = config._exportMeta.transformations.includes('singleItemArrayToObject');
    detected.configureCogsAsImages = config._exportMeta.transformations.includes('configureCogsAsImages');
    detected.transformSwipeLayersToData = config._exportMeta.transformations.includes('transformSwipeLayersToData');
    detected.baseLayerFormat = config._exportMeta.transformations.includes('baseLayerFormat');
    detected.typeToFormatConversion = config._exportMeta.transformations.includes('typeToFormatConversion');
    return detected;
  }
  
  // Fallback: detect by analyzing the data structure
  if (config.sources && Array.isArray(config.sources)) {
    for (const source of config.sources) {
      // Check if data is an object instead of array (indicating transformation was applied)
      if (source.data && !Array.isArray(source.data) && typeof source.data === 'object') {
        // Check if this is a swipe layer transformation
        if (source.data.type === 'swipe') {
          detected.transformSwipeLayersToData = true;
        } else {
          detected.singleItemArrayToObject = true;
        }
      }
      
      // Check statistics field as well
      if (source.statistics && !Array.isArray(source.statistics) && typeof source.statistics === 'object') {
        detected.singleItemArrayToObject = true;
      }
      
      // Check for old base layer format (isBaseLayer in data items but not at source level)
      if (source.data && Array.isArray(source.data)) {
        const hasBaseLayerInData = source.data.some((item: any) => item.isBaseLayer === true);
        const hasBaseLayerAtSourceLevel = source.isBaseLayer === true;
        
        if (hasBaseLayerInData && !hasBaseLayerAtSourceLevel) {
          detected.baseLayerFormat = true;
        }
      }
      
      // NEW: Check for type → format conversion needed
      const checkTypeToFormat = (items: any[]) => {
        return items.some((item: any) => item && item.type && !item.format);
      };

      // Check data array/object for type fields
      if (source.data) {
        const dataArray = Array.isArray(source.data) ? source.data : [source.data];
        if (checkTypeToFormat(dataArray)) {
          detected.typeToFormatConversion = true;
        }
      }
      
      // Check statistics array for type fields
      if (source.statistics) {
        const statsArray = Array.isArray(source.statistics) ? source.statistics : [source.statistics];
        if (checkTypeToFormat(statsArray)) {
          detected.typeToFormatConversion = true;
        }
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

// NEW: Convert type fields to format fields
export const reverseTypeToFormatTransformation = (config: any, enabled: boolean): any => {
  if (!enabled) return config;

  console.log('Converting type fields to format fields');
  const normalizedConfig = { ...config };
  
  if (normalizedConfig.sources && Array.isArray(normalizedConfig.sources)) {
    normalizedConfig.sources = normalizedConfig.sources.map((source: any) => {
      const normalizedSource = { ...source };
      
      // Helper function to convert type to format in data items
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
      
      // Process main data array/object
      if (normalizedSource.data) {
        if (Array.isArray(normalizedSource.data)) {
          normalizedSource.data = convertTypeToFormat(normalizedSource.data);
        } else if (typeof normalizedSource.data === 'object' && normalizedSource.data.type && !normalizedSource.data.format) {
          // Handle single object case
          const { type, ...dataWithoutType } = normalizedSource.data;
          normalizedSource.data = {
            ...dataWithoutType,
            format: type
          };
        }
      }
      
      // Process statistics array
      if (normalizedSource.statistics && Array.isArray(normalizedSource.statistics)) {
        normalizedSource.statistics = convertTypeToFormat(normalizedSource.statistics);
      }
      
      return normalizedSource;
    });
  }
  
  return normalizedConfig;
};

// NEW: Reverse base layer transformation (old format → new format)
export const reverseBaseLayerTransformation = (config: any, enabled: boolean): any => {
  if (!enabled) return config;

  console.log('Reversing base layer transformation (old format → new format)');
  const normalizedConfig = { ...config };
  
  if (normalizedConfig.sources && Array.isArray(normalizedConfig.sources)) {
    normalizedConfig.sources = normalizedConfig.sources.map((source: any) => {
      // Check if this source has base layer items in data but no top-level isBaseLayer
      if (source.data && Array.isArray(source.data)) {
        const hasBaseLayerInData = source.data.some((item: any) => item.isBaseLayer === true);
        const hasBaseLayerAtSourceLevel = source.isBaseLayer === true;
        
        if (hasBaseLayerInData && !hasBaseLayerAtSourceLevel) {
          console.log('Converting base layer from old format:', source.name);
          
          const normalizedSource = { ...source };
          
          // Set isBaseLayer at the source level
          normalizedSource.isBaseLayer = true;
          
          // Remove isBaseLayer from data items
          normalizedSource.data = source.data.map((item: any) => {
            const { isBaseLayer, ...itemWithoutBaseLayer } = item;
            return itemWithoutBaseLayer;
          });
          
          return normalizedSource;
        }
      }
      
      return source;
    });
  }
  
  return normalizedConfig;
};

export const reverseSwipeLayerTransformation = (config: any, enabled: boolean): any => {
  if (!enabled) return config;

  console.log('Reversing swipe layer transformation');
  const normalizedConfig = { ...config };
  
  if (normalizedConfig.sources && Array.isArray(normalizedConfig.sources)) {
    normalizedConfig.sources = normalizedConfig.sources.map((source: any) => {
      // Check if this is a swipe layer with data object format
      if (source.data && !Array.isArray(source.data) && typeof source.data === 'object' && source.data.type === 'swipe') {
        console.log('Converting swipe layer from data object format:', source.name);
        
        const swipeData = source.data;
        const normalizedSource = { ...source };
        
        // Convert data object back to empty array
        normalizedSource.data = [];
        
        // Create or update meta with swipeConfig and ensure required fields exist
        const existingMeta = normalizedSource.meta || {};
        normalizedSource.meta = {
          // Provide defaults for required meta fields
          description: existingMeta.description || 'Swipe layer comparison',
          attribution: {
            text: existingMeta.attribution?.text || '',
            ...(existingMeta.attribution?.url && { url: existingMeta.attribution.url })
          },
          // Preserve any existing meta fields
          ...existingMeta,
          // Add swipe configuration
          swipeConfig: {
            clippedSourceName: swipeData.clippedSource,
            baseSourceNames: swipeData.baseSources || []
          }
        };
        
        return normalizedSource;
      }
      
      return source;
    });
  }
  
  return normalizedConfig;
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
  
  // Apply transformations in the correct order
  
  // 1. Convert type to format fields first (before other transformations)
  if (detectedTransforms.typeToFormatConversion) {
    normalizedConfig = reverseTypeToFormatTransformation(normalizedConfig, true);
  }
  
  // 2. Reverse base layer transformation (old format → new format)
  if (detectedTransforms.baseLayerFormat) {
    normalizedConfig = reverseBaseLayerTransformation(normalizedConfig, true);
  }
  
  // 3. Reverse swipe layer transformation (data object → internal format)
  if (detectedTransforms.transformSwipeLayersToData) {
    normalizedConfig = reverseSwipeLayerTransformation(normalizedConfig, true);
  }
  
  // 4. Reverse COG transformation (before single item array transformation)
  if (detectedTransforms.configureCogsAsImages) {
    normalizedConfig = reverseCogTransformation(normalizedConfig, true);
  }
  
  // 5. Reverse single item object to array transformation
  if (detectedTransforms.singleItemArrayToObject) {
    if (normalizedConfig.sources && Array.isArray(normalizedConfig.sources)) {
      normalizedConfig.sources = normalizedConfig.sources.map((source: any) => {
        const normalizedSource = { ...source };
        
        // Convert data object back to array (but skip swipe layers as they're already handled)
        if (normalizedSource.data && !Array.isArray(normalizedSource.data) && typeof normalizedSource.data === 'object' && normalizedSource.data.type !== 'swipe') {
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
  console.log('Detected import transformations:', detectedTransforms);
  return reverseTransformations(config, detectedTransforms);
};
