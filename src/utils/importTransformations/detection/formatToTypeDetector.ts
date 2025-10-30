
/**
 * Detects if the config uses 'type' instead of 'format' in data objects
 */
export const detectFormatToTypeTransformation = (config: any): boolean => {
  if (!config.sources || !Array.isArray(config.sources)) {
    return false;
  }
  
  for (const source of config.sources) {
    // Check data array/object
    if (source.data) {
      if (Array.isArray(source.data)) {
        // Check if any data item has 'type' but no 'format'
        const hasTypeProperty = source.data.some((item: any) => 
          item && typeof item === 'object' && item.type && !item.format
        );
        if (hasTypeProperty) {
          return true;
        }
      } else if (typeof source.data === 'object' && source.data.type && !source.data.format) {
        return true;
      }
    }
    
    // Check statistics array
    if (source.statistics && Array.isArray(source.statistics)) {
      const hasTypeProperty = source.statistics.some((item: any) => 
        item && typeof item === 'object' && item.type && !item.format
      );
      if (hasTypeProperty) {
        return true;
      }
    }
  }
  
  return false;
};
