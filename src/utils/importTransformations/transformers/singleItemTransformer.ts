
/**
 * Reverse single item object to array transformation
 */
export const reverseSingleItemTransformation = (config: any, enabled: boolean): any => {
  if (!enabled) return config;

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
          
          // Preserve ALL fields when converting to array
          const dataItem = { ...normalizedSource.data };
          normalizedSource.data = [dataItem];
        }
        
        // Convert statistics object back to array
        if (normalizedSource.statistics && 
            !Array.isArray(normalizedSource.statistics) && 
            typeof normalizedSource.statistics === 'object') {
          
          // Preserve ALL fields when converting to array
          const statisticsItem = { ...normalizedSource.statistics };
          normalizedSource.statistics = [statisticsItem];
        }
        
        return normalizedSource;
      })
    };
  }
  
  return config;
};
