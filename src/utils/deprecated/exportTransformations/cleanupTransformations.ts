/**
 * @deprecated This transformation is no longer needed as empty categories can be safely exported.
 * Preserved for potential future use. See src/utils/deprecated/exportTransformations/README.md
 * 
 * Removes empty categories arrays from the configuration.
 */
export const removeEmptyCategories = (config: any, enabled: boolean): any => {
  if (!enabled) return config;

  console.log('Starting empty categories removal...');
  
  const removeEmptyCategoriesRecursive = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(removeEmptyCategoriesRecursive);
    }
    
    const result: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Skip empty categories arrays
      if (key === 'categories' && Array.isArray(value) && value.length === 0) {
        continue;
      }
      
      // Recursively process nested objects and arrays
      result[key] = removeEmptyCategoriesRecursive(value);
    }
    
    return result;
  };

  const transformedConfig = removeEmptyCategoriesRecursive(config);
  console.log('Empty categories removal completed');
  return transformedConfig;
};

/**
 * @deprecated This transformation is no longer needed as category values can be safely included/excluded via other means.
 * Preserved for potential future use. See src/utils/deprecated/exportTransformations/README.md
 * 
 * Removes or keeps category values based on the includeCategoryValues flag.
 */
export const handleCategoryValues = (config: any, includeCategoryValues: boolean): any => {
  // If includeCategoryValues is true, keep the config as-is (include values)
  if (includeCategoryValues) {
    console.log('Keeping category values in export...');
    return config;
  }

  console.log('Removing category values from export...');
  
  const removeCategoryValuesRecursive = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(removeCategoryValuesRecursive);
    }
    
    const result: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (key === 'categories' && Array.isArray(value)) {
        // Remove value field from categories if present
        result[key] = value.map(category => {
          if (typeof category === 'object' && category !== null && 'value' in category) {
            const { value: _, ...categoryWithoutValue } = category;
            return categoryWithoutValue;
          }
          return category;
        });
      } else {
        result[key] = removeCategoryValuesRecursive(value);
      }
    }
    
    return result;
  };

  const transformedConfig = removeCategoryValuesRecursive(config);
  console.log('Category values removal completed');
  return transformedConfig;
};
