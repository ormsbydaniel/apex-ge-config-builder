
/**
 * Detects if the config uses 'type' instead of 'format' in data objects
 */
export const detectFormatToTypeTransformation = (config: any): boolean => {
  console.log('FormatToType detector: Checking for type vs format properties');
  
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
          console.log(`FormatToType detector: Found 'type' property in data array for source "${source.name}"`);
          return true;
        }
      } else if (typeof source.data === 'object' && source.data.type && !source.data.format) {
        console.log(`FormatToType detector: Found 'type' property in data object for source "${source.name}"`);
        return true;
      }
    }
    
    // Check statistics array
    if (source.statistics && Array.isArray(source.statistics)) {
      const hasTypeProperty = source.statistics.some((item: any) => 
        item && typeof item === 'object' && item.type && !item.format
      );
      if (hasTypeProperty) {
        console.log(`FormatToType detector: Found 'type' property in statistics array for source "${source.name}"`);
        return true;
      }
    }
  }
  
  return false;
};
