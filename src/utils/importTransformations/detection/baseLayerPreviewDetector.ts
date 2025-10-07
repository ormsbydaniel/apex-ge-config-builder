
/**
 * Detect if config has old base layer preview format (preview in meta instead of at source level)
 */
export const detectBaseLayerPreviewFormat = (config: any): boolean => {
  if (!config.sources || !Array.isArray(config.sources)) return false;
  
  return config.sources.some((source: any) => {
    // Check if this is a base layer with preview in meta
    if (source.isBaseLayer === true && source.meta?.preview) {
      // And preview is not already at the top level
      return !source.preview;
    }
    return false;
  });
};
