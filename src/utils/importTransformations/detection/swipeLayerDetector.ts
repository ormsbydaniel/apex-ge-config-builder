
/**
 * Detect if config has swipe layers that need to be transformed
 */
export const detectSwipeLayerTransformation = (config: any): boolean => {
  console.log('🔍 SWIPE DETECTOR: Starting swipe layer detection');
  
  if (!config.sources || !Array.isArray(config.sources)) {
    console.log('🔍 SWIPE DETECTOR: No sources array found');
    return false;
  }
  
  const swipeLayers = config.sources.filter((source: any) => {
    // Check for input format swipe layers (data.type === 'swipe')
    const hasSwipeType = source.data && 
                        typeof source.data === 'object' && 
                        !Array.isArray(source.data) && 
                        source.data.type === 'swipe';
    
    if (hasSwipeType) {
      console.log(`🔍 SWIPE DETECTOR: Found swipe layer "${source.name}" with data.type === "swipe"`);
      console.log('🔍 SWIPE DETECTOR: Swipe data structure:', {
        hasClippedSource: !!source.data.clippedSource,
        hasBaseSources: !!source.data.baseSources,
        clippedSourceType: typeof source.data.clippedSource,
        baseSourcesType: typeof source.data.baseSources,
        baseSourcesIsArray: Array.isArray(source.data.baseSources)
      });
    }
    
    return hasSwipeType;
  });
  
  console.log(`🔍 SWIPE DETECTOR: Found ${swipeLayers.length} swipe layers needing transformation`);
  return swipeLayers.length > 0;
};
