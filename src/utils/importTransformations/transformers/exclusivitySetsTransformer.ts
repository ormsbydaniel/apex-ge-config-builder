
/**
 * Reverse transformation for exclusivity sets placement
 * Moves exclusivitySets from data items to the source level
 * Enhanced to work with both object and array data structures
 */
export const reverseExclusivitySetsTransformation = (config: any, enabled: boolean): any => {
  if (!enabled || !config.sources || !Array.isArray(config.sources)) {
    return config;
  }
  
  console.log('ExclusivitySets transformer: Processing sources');
  
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
        console.log(`ExclusivitySets transformer: Processing array data for "${source.name}"`);
        cleanedData = source.data.map((dataItem: any) => {
          if (dataItem.exclusivitySets && Array.isArray(dataItem.exclusivitySets)) {
            console.log(`ExclusivitySets transformer: Found exclusivitySets in data item:`, dataItem.exclusivitySets);
            exclusivitySetsFromData.push(...dataItem.exclusivitySets);
            // Remove exclusivitySets from data item while preserving ALL other fields
            const { exclusivitySets, ...cleanedItem } = dataItem;
            console.log(`ExclusivitySets transformer: Cleaned item (preserved fields):`, cleanedItem);
            return cleanedItem;
          }
          return dataItem;
        });
      }
      // Handle data as single object
      else if (typeof source.data === 'object' && source.data.exclusivitySets) {
        console.log(`ExclusivitySets transformer: Processing object data for "${source.name}"`);
        if (Array.isArray(source.data.exclusivitySets)) {
          console.log(`ExclusivitySets transformer: Found exclusivitySets in data object:`, source.data.exclusivitySets);
          exclusivitySetsFromData.push(...source.data.exclusivitySets);
          // Remove exclusivitySets from data object while preserving ALL other fields
          const { exclusivitySets, ...cleanedItem } = source.data;
          console.log(`ExclusivitySets transformer: Cleaned object (preserved fields):`, cleanedItem);
          cleanedData = cleanedItem;
        }
      }
      
      // If we found exclusivitySets in data, move them to source level
      if (exclusivitySetsFromData.length > 0) {
        console.log(`ExclusivitySets transformer: Moving exclusivitySets to source level for "${source.name}":`, exclusivitySetsFromData);
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
