
/**
 * Reverse base layer transformation (old format → new format)
 */
export const reverseBaseLayerTransformation = (config: any, enabled: boolean): any => {
  if (!enabled) return config;

  const normalizedConfig = { ...config };
  
  if (normalizedConfig.sources && Array.isArray(normalizedConfig.sources)) {
    normalizedConfig.sources = normalizedConfig.sources.map((source: any) => {
      // Check if this source has base layer items in data but no top-level isBaseLayer
      if (source.data && Array.isArray(source.data)) {
        const hasBaseLayerInData = source.data.some((item: any) => item.isBaseLayer === true);
        const hasBaseLayerAtSourceLevel = source.isBaseLayer === true;
        
        if (hasBaseLayerInData && !hasBaseLayerAtSourceLevel) {
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
