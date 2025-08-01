/**
 * Temporal fields preservation transformer
 * Ensures timeframe and defaultTimestamp fields are preserved during import transformations
 */

export const preserveTemporalFields = (config: any, apply: boolean = false): any => {
  if (!apply) {
    console.log('❌ TEMPORAL TRANSFORMER: Not applying transformation (apply=false)');
    return config;
  }
  
  console.log('🕐 TEMPORAL TRANSFORMER: Starting temporal field preservation...');
  console.log('🕐 TEMPORAL TRANSFORMER: Input config sources count:', config.sources?.length);
  
  // Create a deep copy to avoid mutation
  const transformedConfig = JSON.parse(JSON.stringify(config));
  
  // Ensure temporal fields are preserved at source level and in meta.temporal
  if (transformedConfig.sources && Array.isArray(transformedConfig.sources)) {
    transformedConfig.sources = transformedConfig.sources.map((source: any, index: number) => {
      console.log(`🕐 TEMPORAL TRANSFORMER: Processing source ${index + 1}: "${source.name}"`);
      console.log(`🕐 TEMPORAL TRANSFORMER: Original source timeframe:`, source.timeframe);
      console.log(`🕐 TEMPORAL TRANSFORMER: Original source data:`, source.data);
      
      const preservedSource = { ...source };
      
      // Extract temporal fields from various locations
      let timeframe = source.timeframe;
      let defaultTimestamp = source.defaultTimestamp;
      
      // Check meta object for temporal fields
      if (source.meta) {
        // Check flat structure in meta
        if (source.meta.timeframe && !timeframe) {
          timeframe = source.meta.timeframe;
        }
        if (source.meta.defaultTimestamp !== undefined && defaultTimestamp === undefined) {
          defaultTimestamp = source.meta.defaultTimestamp;
        }
        
        // Check nested temporal object structure
        if (source.meta.temporal) {
          if (source.meta.temporal.timeframe && !timeframe) {
            timeframe = source.meta.temporal.timeframe;
          }
          if (source.meta.temporal.defaultTimestamp !== undefined && defaultTimestamp === undefined) {
            defaultTimestamp = source.meta.temporal.defaultTimestamp;
          }
        }
      }
      
      // ALWAYS preserve timeframe field at source level if it exists anywhere
      if (timeframe) {
        preservedSource.timeframe = timeframe;
        console.log('Preserved timeframe:', timeframe);
      }
      if (defaultTimestamp !== undefined) {
        preservedSource.defaultTimestamp = defaultTimestamp;
        console.log('Preserved defaultTimestamp:', defaultTimestamp);
      }
      
      // Handle timestamps in data array items - CRITICAL FIX
      if (preservedSource.data && Array.isArray(preservedSource.data)) {
        preservedSource.data = preservedSource.data.map((dataItem: any) => {
          // Create a copy and preserve ALL fields including timestamps
          const preservedDataItem = { ...dataItem };
          
          // Explicitly check for timestamps in original source data
          const originalDataItem = source.data?.find((orig: any) => 
            orig.url === dataItem.url && orig.format === dataItem.format
          );
          
          if (originalDataItem && originalDataItem.timestamps) {
            preservedDataItem.timestamps = originalDataItem.timestamps;
            console.log('Preserved timestamps in data item:', originalDataItem.timestamps);
          }
          
          return preservedDataItem;
        });
      }
      
      // Also ensure meta.temporal structure for schema compliance
      if (timeframe || defaultTimestamp !== undefined) {
        if (!preservedSource.meta) {
          preservedSource.meta = {};
        }
        preservedSource.meta.temporal = {
          ...(timeframe && { timeframe }),
          ...(defaultTimestamp !== undefined && { defaultTimestamp })
        };
      }
      
      return preservedSource;
    });
  }
  
  
  console.log('🕐 TEMPORAL TRANSFORMER: Final result - source 49 after transformation:');
  const source49 = transformedConfig.sources?.find((s: any) => s.name?.includes('TIMEFRAME & TIMESTAMPS'));
  if (source49) {
    console.log('🕐 TEMPORAL TRANSFORMER: Final source 49:', {
      name: source49.name,
      timeframe: source49.timeframe,
      data: source49.data,
      metaTemporal: source49.meta?.temporal
    });
  }
  
  console.log('🕐 TEMPORAL TRANSFORMER: Temporal fields preservation complete');
  return transformedConfig;
};

export const reverseTemporalFieldsTransformation = preserveTemporalFields;