
/**
 * Detect if config has old base layer format (isBaseLayer in data items but not at source level)
 */
export const detectBaseLayerFormat = (config: any): boolean => {
  if (!config.sources || !Array.isArray(config.sources)) return false;
  
  return config.sources.some((source: any) => {
    if (!source.data || !Array.isArray(source.data)) return false;
    
    const hasBaseLayerInData = source.data.some((item: any) => item.isBaseLayer === true);
    const hasBaseLayerAtSourceLevel = source.isBaseLayer === true;
    
    return hasBaseLayerInData && !hasBaseLayerAtSourceLevel;
  });
};
