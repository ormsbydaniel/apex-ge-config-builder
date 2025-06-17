
/**
 * Detect if config has exclusivitySets in data items that need to be moved to source level
 * Enhanced to work with both object and array data structures
 */
export const detectExclusivitySetsTransformation = (config: any): boolean => {
  if (!config.sources || !Array.isArray(config.sources)) return false;
  
  return config.sources.some((source: any) => {
    if (!source.data) return false;
    
    // Handle data as array
    if (Array.isArray(source.data)) {
      return source.data.some((dataItem: any) => {
        return dataItem && 
               dataItem.exclusivitySets && 
               Array.isArray(dataItem.exclusivitySets) && 
               dataItem.exclusivitySets.length > 0;
      });
    }
    
    // Handle data as single object
    if (typeof source.data === 'object') {
      return source.data.exclusivitySets && 
             Array.isArray(source.data.exclusivitySets) && 
             source.data.exclusivitySets.length > 0;
    }
    
    return false;
  });
};
