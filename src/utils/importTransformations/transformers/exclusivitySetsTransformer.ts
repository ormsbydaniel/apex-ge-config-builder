
/**
 * Reverse transformation for exclusivity sets placement
 * Moves exclusivitySets from data items to the source level
 * Enhanced to work with both object and array data structures
 */
export const reverseExclusivitySetsTransformation = (config: any, enabled: boolean): any => {
  if (!enabled || !config.sources || !Array.isArray(config.sources)) {
    return config;
  }
  
  return {
    ...config,
    sources: config.sources.map((source: any) => {
      // Skip if data doesn't exist
      if (!source.data) {
        return source;
      }
      
      const exclusivitySetsFromData: string[] = [];
      let cleanedData = source.data;
      
      // Handle data as array
      if (Array.isArray(source.data)) {
        cleanedData = source.data.map((dataItem: any) => {
          if (dataItem.exclusivitySets && Array.isArray(dataItem.exclusivitySets)) {
            exclusivitySetsFromData.push(...dataItem.exclusivitySets);
            // Remove exclusivitySets from data item
            const { exclusivitySets, ...cleanedItem } = dataItem;
            return cleanedItem;
          }
          return dataItem;
        });
      }
      // Handle data as single object
      else if (typeof source.data === 'object' && source.data.exclusivitySets) {
        if (Array.isArray(source.data.exclusivitySets)) {
          exclusivitySetsFromData.push(...source.data.exclusivitySets);
          // Remove exclusivitySets from data object
          const { exclusivitySets, ...cleanedItem } = source.data;
          cleanedData = cleanedItem;
        }
      }
      
      // If we found exclusivitySets in data, move them to source level
      if (exclusivitySetsFromData.length > 0) {
        // Merge with existing exclusivitySets at source level (if any)
        const existingExclusivitySets = source.exclusivitySets || [];
        const mergedExclusivitySets = [
          ...existingExclusivitySets,
          ...exclusivitySetsFromData
        ];
        // Remove duplicates
        const uniqueExclusivitySets = [...new Set(mergedExclusivitySets)];
        
        return {
          ...source,
          data: cleanedData,
          exclusivitySets: uniqueExclusivitySets
        };
      }
      
      return {
        ...source,
        data: cleanedData
      };
    })
  };
};
