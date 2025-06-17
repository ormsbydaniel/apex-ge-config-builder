
/**
 * Reverse single item object to array transformation
 */
export const reverseSingleItemTransformation = (config: any, enabled: boolean): any => {
  if (!enabled) return config;

  console.log('SingleItem transformer: Converting objects to arrays');

  if (config.sources && Array.isArray(config.sources)) {
    return {
      ...config,
      sources: config.sources.map((source: any) => {
        const normalizedSource = { ...source };
        
        // Convert data object back to array (but skip swipe layers as they're already handled)
        if (normalizedSource.data && 
            !Array.isArray(normalizedSource.data) && 
            typeof normalizedSource.data === 'object' && 
            normalizedSource.data.type !== 'swipe') {
          
          console.log(`SingleItem transformer: Converting data for "${source.name}":`, normalizedSource.data);
          
          // Preserve ALL fields when converting to array
          const dataItem = { ...normalizedSource.data };
          normalizedSource.data = [dataItem];
          
          console.log(`SingleItem transformer: Converted to array:`, normalizedSource.data);
        }
        
        // Convert statistics object back to array
        if (normalizedSource.statistics && 
            !Array.isArray(normalizedSource.statistics) && 
            typeof normalizedSource.statistics === 'object') {
          
          console.log(`SingleItem transformer: Converting statistics for "${source.name}":`, normalizedSource.statistics);
          
          // Preserve ALL fields when converting to array
          const statisticsItem = { ...normalizedSource.statistics };
          normalizedSource.statistics = [statisticsItem];
          
          console.log(`SingleItem transformer: Converted statistics to array:`, normalizedSource.statistics);
        }
        
        return normalizedSource;
      })
    };
  }
  
  return config;
};
