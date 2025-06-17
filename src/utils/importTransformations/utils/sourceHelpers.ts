
/**
 * Process both data and statistics arrays of a source with a transformation function
 */
export const processSourceArrays = (source: any, transformFn: (items: any[]) => any[]): any => {
  const normalizedSource = { ...source };
  
  // Process main data array/object
  if (normalizedSource.data) {
    if (Array.isArray(normalizedSource.data)) {
      normalizedSource.data = transformFn(normalizedSource.data);
    } else if (typeof normalizedSource.data === 'object') {
      normalizedSource.data = transformFn([normalizedSource.data])[0];
    }
  }
  
  // Process statistics array
  if (normalizedSource.statistics && Array.isArray(normalizedSource.statistics)) {
    normalizedSource.statistics = transformFn(normalizedSource.statistics);
  }
  
  return normalizedSource;
};

/**
 * Check if a source has items with a specific condition in data or statistics
 */
export const sourceHasItemsMatching = (source: any, predicate: (item: any) => boolean): boolean => {
  // Check data array/object
  if (source.data) {
    const dataArray = Array.isArray(source.data) ? source.data : [source.data];
    if (dataArray.some(predicate)) return true;
  }
  
  // Check statistics array
  if (source.statistics && Array.isArray(source.statistics)) {
    if (source.statistics.some(predicate)) return true;
  }
  
  return false;
};
