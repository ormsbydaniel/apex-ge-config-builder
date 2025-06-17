
/**
 * Reverse swipe layer transformation
 */
export const reverseSwipeLayerTransformation = (config: any, enabled: boolean): any => {
  if (!enabled) return config;

  console.log('SwipeLayer transformer: Starting swipe layer transformation');
  const normalizedConfig = { ...config };
  
  if (normalizedConfig.sources && Array.isArray(normalizedConfig.sources)) {
    normalizedConfig.sources = normalizedConfig.sources.map((source: any, index: number) => {
      // Check if this is a swipe layer with data object format
      if (source.data && !Array.isArray(source.data) && typeof source.data === 'object' && source.data.type === 'swipe') {
        console.log(`SwipeLayer transformer: Converting swipe layer "${source.name}" at index ${index}`);
        console.log('SwipeLayer transformer: Original source:', {
          name: source.name,
          data: source.data,
          meta: source.meta,
          layout: source.layout
        });
        
        const swipeData = source.data;
        const normalizedSource = { ...source };
        
        // Validate required swipe data fields
        if (!swipeData.clippedSource) {
          console.warn(`SwipeLayer transformer: Missing clippedSource for swipe layer "${source.name}"`);
        }
        if (!swipeData.baseSources || !Array.isArray(swipeData.baseSources)) {
          console.warn(`SwipeLayer transformer: Missing or invalid baseSources for swipe layer "${source.name}"`);
        }
        
        // Convert data object back to empty array
        normalizedSource.data = [];
        
        // Get existing meta, handle both empty objects and undefined
        const existingMeta = normalizedSource.meta || {};
        const isEmptyMeta = Object.keys(existingMeta).length === 0;
        
        console.log(`SwipeLayer transformer: Meta analysis for "${source.name}":`, {
          existingMeta,
          isEmptyMeta,
          hasDescription: !!existingMeta.description,
          hasAttribution: !!existingMeta.attribution?.text
        });
        
        // FIXED: Properly construct meta object to avoid overwriting defaults
        normalizedSource.meta = {
          // Always provide required fields with proper defaults
          description: (existingMeta.description && existingMeta.description.trim()) || 
                      `Comparison between ${swipeData.clippedSource} and ${(swipeData.baseSources || []).join(', ')}`,
          attribution: {
            text: (existingMeta.attribution?.text && existingMeta.attribution.text.trim()) || 
                  'Swipe layer comparison',
            // Preserve existing URL if it exists
            ...(existingMeta.attribution?.url && { url: existingMeta.attribution.url })
          },
          // Add swipe configuration
          swipeConfig: {
            clippedSourceName: swipeData.clippedSource,
            baseSourceNames: swipeData.baseSources || []
          },
          // Preserve any other existing meta fields that aren't core required fields
          ...Object.fromEntries(
            Object.entries(existingMeta).filter(([key]) => 
              !['description', 'attribution', 'swipeConfig'].includes(key)
            )
          )
        };
        
        console.log(`SwipeLayer transformer: Transformed source "${source.name}":`, {
          name: normalizedSource.name,
          dataIsArray: Array.isArray(normalizedSource.data),
          dataLength: normalizedSource.data.length,
          hasSwipeConfig: !!normalizedSource.meta.swipeConfig,
          swipeConfig: normalizedSource.meta.swipeConfig,
          metaDescription: normalizedSource.meta.description,
          metaAttribution: normalizedSource.meta.attribution,
          metaKeys: Object.keys(normalizedSource.meta),
          finalMeta: normalizedSource.meta
        });
        
        return normalizedSource;
      }
      
      return source;
    });
  }
  
  console.log('SwipeLayer transformer: Transformation complete');
  return normalizedConfig;
};
