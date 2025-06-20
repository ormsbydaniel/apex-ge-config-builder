
import { DataSource, DataSourceItem } from '@/types/config';

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
