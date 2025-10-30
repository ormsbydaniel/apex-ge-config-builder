
/**
 * Detect if config has swipe layers that need to be transformed
 */
export const detectSwipeLayerTransformation = (config: any): boolean => {
  if (!config.sources || !Array.isArray(config.sources)) {
    return false;
  }
  
  const swipeLayers = config.sources.filter((source: any) => {
    const hasSwipeType = source.data && 
                        typeof source.data === 'object' && 
                        !Array.isArray(source.data) && 
                        source.data.type === 'swipe';
    
    return hasSwipeType;
  });
  
  return swipeLayers.length > 0;
};
