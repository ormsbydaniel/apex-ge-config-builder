
/**
 * Reverse swipe layer transformation
 */
export const reverseSwipeLayerTransformation = (config: any, enabled: boolean): any => {
  if (!enabled) return config;

  console.log('Reversing swipe layer transformation');
  const normalizedConfig = { ...config };
  
  if (normalizedConfig.sources && Array.isArray(normalizedConfig.sources)) {
    normalizedConfig.sources = normalizedConfig.sources.map((source: any) => {
      // Check if this is a swipe layer with data object format
      if (source.data && !Array.isArray(source.data) && typeof source.data === 'object' && source.data.type === 'swipe') {
        console.log('Converting swipe layer from data object format:', source.name);
        
        const swipeData = source.data;
        const normalizedSource = { ...source };
        
        // Convert data object back to empty array
        normalizedSource.data = [];
        
        // Create or update meta with swipeConfig and ensure required fields exist
        const existingMeta = normalizedSource.meta || {};
        normalizedSource.meta = {
          // Provide defaults for required meta fields
          description: existingMeta.description || 'Swipe layer comparison',
          attribution: {
            text: existingMeta.attribution?.text || '',
            ...(existingMeta.attribution?.url && { url: existingMeta.attribution.url })
          },
          // Preserve any existing meta fields
          ...existingMeta,
          // Add swipe configuration
          swipeConfig: {
            clippedSourceName: swipeData.clippedSource,
            baseSourceNames: swipeData.baseSources || []
          }
        };
        
        return normalizedSource;
      }
      
      return source;
    });
  }
  
  return normalizedConfig;
};
