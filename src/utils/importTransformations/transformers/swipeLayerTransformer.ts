
/**
 * Reverse swipe layer transformation
 */
export const reverseSwipeLayerTransformation = (config: any, enabled: boolean): any => {
  if (!enabled) return config;

  console.log('SwipeLayer transformer: Starting swipe layer transformation');
  console.log('SwipeLayer transformer: Input config sources:', config.sources?.map((s: any) => ({
    name: s.name,
    hasData: !!s.data,
    dataType: typeof s.data,
    dataIsArray: Array.isArray(s.data),
    dataContent: s.data
  })));
  
  const normalizedConfig = { ...config };
  
  if (normalizedConfig.sources && Array.isArray(normalizedConfig.sources)) {
    normalizedConfig.sources = normalizedConfig.sources.map((source: any, index: number) => {
      console.log(`SwipeLayer transformer: Processing source "${source.name}" at index ${index}`);
      console.log('SwipeLayer transformer: Source before transformation:', {
        name: source.name,
        data: source.data,
        dataType: typeof source.data,
        dataIsArray: Array.isArray(source.data),
        meta: source.meta,
        layout: source.layout
      });

      // Check if this is a swipe layer with data object format
      if (source.data && !Array.isArray(source.data) && typeof source.data === 'object' && source.data.type === 'swipe') {
        console.log(`SwipeLayer transformer: FOUND SWIPE LAYER "${source.name}" - Starting transformation`);
        console.log('SwipeLayer transformer: Original swipe data:', source.data);
        
        const swipeData = source.data;
        
        // Create a completely new source object to ensure transformation takes effect
        const transformedSource = {
          ...source,
          // Convert data object back to empty array
          data: [],
          // Construct proper meta with swipeConfig
          meta: {
            // Always provide required fields with proper defaults
            description: (source.meta?.description && source.meta.description.trim()) || 
                        `Comparison between ${swipeData.clippedSource} and ${(swipeData.baseSources || []).join(', ')}`,
            attribution: {
              text: (source.meta?.attribution?.text && source.meta.attribution.text.trim()) || 
                    'Swipe layer comparison',
              // Preserve existing URL if it exists
              ...(source.meta?.attribution?.url && { url: source.meta.attribution.url })
            },
            // Add swipe configuration
            swipeConfig: {
              clippedSourceName: swipeData.clippedSource,
              baseSourceNames: swipeData.baseSources || []
            },
            // Preserve any other existing meta fields
            ...Object.fromEntries(
              Object.entries(source.meta || {}).filter(([key]) => 
                !['description', 'attribution', 'swipeConfig'].includes(key)
              )
            )
          }
        };
        
        console.log(`SwipeLayer transformer: TRANSFORMATION COMPLETE for "${source.name}":`, {
          name: transformedSource.name,
          dataIsArray: Array.isArray(transformedSource.data),
          dataLength: transformedSource.data.length,
          hasSwipeConfig: !!transformedSource.meta.swipeConfig,
          swipeConfig: transformedSource.meta.swipeConfig,
          metaDescription: transformedSource.meta.description,
          metaAttribution: transformedSource.meta.attribution,
          metaKeys: Object.keys(transformedSource.meta),
          completeTransformedSource: transformedSource
        });
        
        // Validate transformation was successful
        if (!Array.isArray(transformedSource.data)) {
          console.error(`SwipeLayer transformer: ERROR - data is not array after transformation:`, transformedSource.data);
        }
        if (!transformedSource.meta.swipeConfig) {
          console.error(`SwipeLayer transformer: ERROR - swipeConfig missing after transformation:`, transformedSource.meta);
        }
        
        return transformedSource;
      }
      
      console.log(`SwipeLayer transformer: Source "${source.name}" is not a swipe layer, returning unchanged`);
      return source;
    });
  }
  
  console.log('SwipeLayer transformer: Transformation complete, final sources:', 
    normalizedConfig.sources?.map((s: any) => ({
      name: s.name,
      hasData: !!s.data,
      dataIsArray: Array.isArray(s.data),
      hasSwipeConfig: !!s.meta?.swipeConfig,
      swipeConfig: s.meta?.swipeConfig
    }))
  );
  
  return normalizedConfig;
};
