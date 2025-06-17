
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
        
        // Create or update meta with swipeConfig and ensure required fields exist
        const existingMeta = normalizedSource.meta || {};
        
        // FIXED: Construct meta object properly to avoid overwriting defaults
        normalizedSource.meta = {
          // Preserve any existing meta fields first
          ...existingMeta,
          // Then ensure required fields are present (these will override empty/missing values)
          description: existingMeta.description || `Comparison between ${swipeData.clippedSource} and ${(swipeData.baseSources || []).join(', ')}`,
          attribution: {
            // Preserve existing attribution if it exists
            ...existingMeta.attribution,
            // Ensure text is present
            text: existingMeta.attribution?.text || 'Swipe layer comparison'
          },
          // Add swipe configuration - handle both old and new formats
          swipeConfig: {
            clippedSourceName: swipeData.clippedSource,
            baseSourceNames: swipeData.baseSources || []
          }
        };
        
        console.log(`SwipeLayer transformer: Transformed source "${source.name}":`, {
          name: normalizedSource.name,
          dataIsArray: Array.isArray(normalizedSource.data),
          dataLength: normalizedSource.data.length,
          hasSwipeConfig: !!normalizedSource.meta.swipeConfig,
          swipeConfig: normalizedSource.meta.swipeConfig,
          metaDescription: normalizedSource.meta.description,
          metaAttribution: normalizedSource.meta.attribution,
          metaKeys: Object.keys(normalizedSource.meta)
        });
        
        return normalizedSource;
      }
      
      return source;
    });
  }
  
  console.log('SwipeLayer transformer: Transformation complete');
  return normalizedConfig;
};
