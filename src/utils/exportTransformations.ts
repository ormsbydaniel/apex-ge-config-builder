
import { DataSource, DataSourceItem } from '@/types/config';
import { ExportOptions } from '@/components/ExportOptionsDialog';

interface ExportMetadata {
  version: string;
  transformations: string[];
  exportedAt: string;
}

export const transformSingleItemArrays = (config: any, enabled: boolean): any => {
  if (!enabled) return config;

  const transformedConfig = { ...config };
  
  // Transform sources
  if (transformedConfig.sources) {
    transformedConfig.sources = transformedConfig.sources.map((source: DataSource) => {
      const transformedSource = { ...source };
      
      // Transform main data array if it has only one item
      if (transformedSource.data && Array.isArray(transformedSource.data) && transformedSource.data.length === 1) {
        // Create a new object without the data array, then add data as single object
        const { data, ...rest } = transformedSource;
        return {
          ...rest,
          data: data[0] // This transforms the exported format, not the internal type
        };
      }
      
      // Transform statistics array if it exists and has only one item
      if (transformedSource.statistics && Array.isArray(transformedSource.statistics) && transformedSource.statistics.length === 1) {
        // Apply transformation to statistics as well
        const { statistics, ...rest } = transformedSource;
        return {
          ...rest,
          statistics: statistics[0]
        };
      }
      
      return transformedSource;
    });
  }
  
  return transformedConfig;
};

export const transformCogsAsImages = (config: any, enabled: boolean): any => {
  if (!enabled) return config;

  console.log('Starting COG transformation...');
  const transformedConfig = { ...config };
  
  // Transform sources
  if (transformedConfig.sources) {
    transformedConfig.sources = transformedConfig.sources.map((source: DataSource) => {
      const transformedSource = { ...source };
      
      // Transform main data array for COGs
      if (transformedSource.data && Array.isArray(transformedSource.data)) {
        const { cogItems, nonCogItems } = transformedSource.data.reduce((acc: any, item: DataSourceItem) => {
          if (item.format === 'cog') {
            acc.cogItems.push(item);
          } else {
            acc.nonCogItems.push(item);
          }
          return acc;
        }, { cogItems: [], nonCogItems: [] });

        console.log(`Found ${cogItems.length} COG items and ${nonCogItems.length} non-COG items in data array`);

        // If we have COG items (single or multiple), consolidate them
        if (cogItems.length > 0) {
          // Extract URLs and find max zIndex - only include items with URLs
          const images = cogItems
            .filter((item: DataSourceItem) => item.url)
            .map((item: DataSourceItem) => ({ url: item.url }));
          
          console.log(`Processing ${images.length} COG items with URLs`);
          
          if (images.length > 0) {
            const maxZIndex = Math.max(...cogItems.map((item: DataSourceItem) => item.zIndex || 0));
            
            // Create consolidated COG object using properties from the first COG item
            const firstCogItem = cogItems[0];
            const { url, ...cogPropsWithoutUrl } = firstCogItem;
            
            const consolidatedCog = {
              ...cogPropsWithoutUrl,
              images,
              zIndex: maxZIndex
            };

            console.log('Created consolidated COG object:', consolidatedCog);

            // Replace data array with consolidated COG + non-COG items
            transformedSource.data = [...nonCogItems, consolidatedCog];
            console.log('Updated data array:', transformedSource.data);
          }
        }
      }
      
      // Transform statistics array for COGs if it exists
      if (transformedSource.statistics && Array.isArray(transformedSource.statistics)) {
        const { cogItems, nonCogItems } = transformedSource.statistics.reduce((acc: any, item: DataSourceItem) => {
          if (item.format === 'cog') {
            acc.cogItems.push(item);
          } else {
            acc.nonCogItems.push(item);
          }
          return acc;
        }, { cogItems: [], nonCogItems: [] });

        console.log(`Found ${cogItems.length} COG items and ${nonCogItems.length} non-COG items in statistics array`);

        // If we have COG items (single or multiple), consolidate them
        if (cogItems.length > 0) {
          // Extract URLs and find max zIndex - only include items with URLs
          const images = cogItems
            .filter((item: DataSourceItem) => item.url)
            .map((item: DataSourceItem) => ({ url: item.url }));
          
          if (images.length > 0) {
            const maxZIndex = Math.max(...cogItems.map((item: DataSourceItem) => item.zIndex || 0));
            
            // Create consolidated COG object using properties from the first COG item
            const firstCogItem = cogItems[0];
            const { url, ...cogPropsWithoutUrl } = firstCogItem;
            
            const consolidatedCog = {
              ...cogPropsWithoutUrl,
              images,
              zIndex: maxZIndex
            };

            // Replace statistics array with consolidated COG + non-COG items
            transformedSource.statistics = [...nonCogItems, consolidatedCog];
          }
        }
      }
      
      return transformedSource;
    });
  }
  
  console.log('COG transformation completed');
  return transformedConfig;
};

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

export const handleCategoryValues = (config: any, includeCategoryValues: boolean): any => {
  if (includeCategoryValues) return config;

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

export const applyExportTransformations = (config: any, options: ExportOptions): any => {
  let transformedConfig = { ...config };
  const appliedTransformations: string[] = [];
  
  console.log('Applying export transformations with options:', options);
  
  // Apply single item array to object transformation
  if (options.singleItemArrayToObject) {
    transformedConfig = transformSingleItemArrays(transformedConfig, true);
    appliedTransformations.push('singleItemArrayToObject');
  }
  
  // Apply COG consolidation transformation
  if (options.configureCogsAsImages) {
    transformedConfig = transformCogsAsImages(transformedConfig, true);
    appliedTransformations.push('configureCogsAsImages');
  }
  
  // Apply empty categories removal transformation
  if (options.removeEmptyCategories) {
    transformedConfig = removeEmptyCategories(transformedConfig, true);
    appliedTransformations.push('removeEmptyCategories');
  }
  
  // Handle category values (remove them if includeCategoryValues is false)
  transformedConfig = handleCategoryValues(transformedConfig, options.includeCategoryValues);
  if (!options.includeCategoryValues) {
    appliedTransformations.push('removeCategoryValues');
  }
  
  // Add export metadata
  const exportMetadata: ExportMetadata = {
    version: '1.0.0',
    transformations: appliedTransformations,
    exportedAt: new Date().toISOString()
  };
  
  // Only add metadata if transformations were applied
  if (appliedTransformations.length > 0) {
    transformedConfig._exportMeta = exportMetadata;
  }
  
  console.log('Final transformed config:', transformedConfig);
  return transformedConfig;
};
