
import { sourceHasItemsMatching } from '../utils/sourceHelpers';

/**
 * Detect if config has COG objects with images arrays instead of url
 */
export const detectCogTransformation = (config: any): boolean => {
  if (!config.sources || !Array.isArray(config.sources)) return false;
  
  const isCogWithImages = (item: any): boolean => {
    return item && 
           item.format === 'cog' && 
           item.images && 
           Array.isArray(item.images) && 
           !item.url;
  };
  
  return config.sources.some((source: any) => 
    sourceHasItemsMatching(source, isCogWithImages)
  );
};
