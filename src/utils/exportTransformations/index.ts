
import { ExportOptions } from '@/components/ExportOptionsDialog';

/**
 * Applies export transformations to the configuration.
 * 
 * Note: As of November 2024, all backward compatibility transformations have been deprecated.
 * The viewer now handles format variations through import transformations instead.
 * This function is kept for potential future export transformations.
 * 
 * @param config - The configuration object to transform
 * @param options - Export options (currently only sortToMatchUiOrder is used)
 * @returns The configuration object (currently unchanged)
 */
export const applyExportTransformations = (config: any, options: ExportOptions): any => {
  // Currently a pass-through function
  // The sortToMatchUiOrder option is handled in useConfigExport.ts
  return config;
};
