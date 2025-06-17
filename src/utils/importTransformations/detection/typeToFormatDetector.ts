
import { sourceHasItemsMatching } from '../utils/sourceHelpers';

/**
 * Detect if config has type fields that need to be converted to format fields
 */
export const detectTypeToFormatConversion = (config: any): boolean => {
  if (!config.sources || !Array.isArray(config.sources)) return false;
  
  const hasTypeField = (item: any): boolean => {
    return item && item.type && !item.format;
  };
  
  return config.sources.some((source: any) => 
    sourceHasItemsMatching(source, hasTypeField)
  );
};
