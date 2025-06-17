
/**
 * Detect if config has swipe layers in data object format
 */
export const detectSwipeLayerTransformation = (config: any): boolean => {
  if (!config.sources || !Array.isArray(config.sources)) return false;
  
  return config.sources.some((source: any) => {
    // Check for the old swipe layer format
    const hasSwipeData = source.data && 
           !Array.isArray(source.data) && 
           typeof source.data === 'object' && 
           source.data.type === 'swipe';
    
    if (hasSwipeData) {
      console.log(`SwipeLayer detector: Found swipe layer "${source.name}" with data object format:`, {
        dataType: source.data.type,
        clippedSource: source.data.clippedSource,
        baseSources: source.data.baseSources,
        hasLayout: !!source.layout,
        hasMeta: !!source.meta,
        metaIsEmpty: source.meta && Object.keys(source.meta).length === 0
      });
      return true;
    }
    
    return false;
  });
};
