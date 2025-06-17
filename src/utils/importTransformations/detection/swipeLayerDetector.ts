
/**
 * Detect if config has swipe layers in data object format
 */
export const detectSwipeLayerTransformation = (config: any): boolean => {
  if (!config.sources || !Array.isArray(config.sources)) return false;
  
  return config.sources.some((source: any) => {
    return source.data && 
           !Array.isArray(source.data) && 
           typeof source.data === 'object' && 
           source.data.type === 'swipe';
  });
};
