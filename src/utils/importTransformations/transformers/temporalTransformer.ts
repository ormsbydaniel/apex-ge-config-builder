/**
 * Temporal fields preservation transformer
 * Ensures timeframe and defaultTimestamp fields are preserved during import transformations
 */

export const preserveTemporalFields = (config: any, apply: boolean = false): any => {
  if (!apply) return config;
  
  console.log('Preserving temporal fields during import...');
  
  // Create a deep copy to avoid mutation
  const transformedConfig = JSON.parse(JSON.stringify(config));
  
  // Ensure temporal fields are preserved at source level
  if (transformedConfig.sources && Array.isArray(transformedConfig.sources)) {
    transformedConfig.sources = transformedConfig.sources.map((source: any) => {
      const preservedSource = { ...source };
      
      // Preserve timeframe and defaultTimestamp if they exist
      if (source.timeframe) {
        preservedSource.timeframe = source.timeframe;
      }
      if (source.defaultTimestamp !== undefined) {
        preservedSource.defaultTimestamp = source.defaultTimestamp;
      }
      
      // Also check meta object for temporal fields and move them to top level
      if (source.meta) {
        if (source.meta.timeframe && !preservedSource.timeframe) {
          preservedSource.timeframe = source.meta.timeframe;
        }
        if (source.meta.defaultTimestamp !== undefined && preservedSource.defaultTimestamp === undefined) {
          preservedSource.defaultTimestamp = source.meta.defaultTimestamp;
        }
      }
      
      return preservedSource;
    });
  }
  
  console.log('Temporal fields preservation complete');
  return transformedConfig;
};

export const reverseTemporalFieldsTransformation = preserveTemporalFields;