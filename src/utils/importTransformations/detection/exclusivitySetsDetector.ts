
/**
 * Detect if config has exclusivitySets in data items that need to be moved to source level
 */
export const detectExclusivitySetsTransformation = (config: any): boolean => {
  if (!config.sources || !Array.isArray(config.sources)) return false;
  
  return config.sources.some((source: any) => {
    if (!Array.isArray(source.data)) return false;
    
    return source.data.some((dataItem: any) => {
      return dataItem && 
             dataItem.exclusivitySets && 
             Array.isArray(dataItem.exclusivitySets) && 
             dataItem.exclusivitySets.length > 0;
    });
  });
};
