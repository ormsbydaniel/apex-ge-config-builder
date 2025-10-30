
/**
 * Transform base layer preview from old format (in meta) to new format (at source level)
 */
export const transformBaseLayerPreview = (config: any, enabled: boolean): any => {
  if (!enabled) return config;

  const normalizedConfig = { ...config };
  
  if (normalizedConfig.sources && Array.isArray(normalizedConfig.sources)) {
    normalizedConfig.sources = normalizedConfig.sources.map((source: any) => {
      // Check if this is a base layer with preview in meta but not at top level
      if (source.isBaseLayer === true && source.meta?.preview && !source.preview) {
        const normalizedSource = { ...source };
        
        // Move preview to top level
        normalizedSource.preview = source.meta.preview;
        
        // Remove preview from meta
        const { preview, ...metaWithoutPreview } = source.meta;
        normalizedSource.meta = metaWithoutPreview;
        
        return normalizedSource;
      }
      
      return source;
    });
  }
  
  return normalizedConfig;
};
