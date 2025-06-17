
/**
 * Detect if config has single item objects instead of arrays
 */
export const detectSingleItemArrayToObject = (config: any): boolean => {
  if (!config.sources || !Array.isArray(config.sources)) return false;
  
  return config.sources.some((source: any) => {
    // Check if data is an object instead of array (excluding swipe layers)
    if (source.data && 
        !Array.isArray(source.data) && 
        typeof source.data === 'object' && 
        source.data.type !== 'swipe') {
      return true;
    }
    
    // Check statistics field
    if (source.statistics && 
        !Array.isArray(source.statistics) && 
        typeof source.statistics === 'object') {
      return true;
    }
    
    return false;
  });
};
