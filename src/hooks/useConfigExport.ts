
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useConfig } from '@/contexts/ConfigContext';
import { sanitizeUrl } from '@/utils/urlSanitizer';
import { applyExportTransformations } from '@/utils/exportTransformations';
import { ExportOptions } from '@/components/ExportOptionsDialog';
import { sortSources, sortServices, orderSourceProperties } from '@/utils/configSorting';

export const useConfigExport = () => {
  const { config, dispatch } = useConfig();
  const { toast } = useToast();

  const exportConfig = useCallback((options: ExportOptions = { 
    singleItemArrayToObject: false, 
    configureCogsAsImages: false, 
    removeEmptyCategories: false, 
    includeCategoryValues: true,
    addNormalizeFalseToCogs: false,
    transformSwipeLayersToData: false,
    changeFormatToType: false,
    sortToMatchUiOrder: false
  }) => {
    try {
      
      // Create a clean config object without internal state and capabilities
      const exportData = {
        version: config.version || '1.0.0',
        layout: config.layout,
        interfaceGroups: config.interfaceGroups,
        exclusivitySets: config.exclusivitySets,
        ...(config.mapConstraints && { mapConstraints: config.mapConstraints }),
        // Export services without capabilities and with sanitized URLs
        services: config.services.map(service => ({
          id: service.id,
          name: service.name,
          url: sanitizeUrl(service.url),
          format: service.format
        })),
        // Export sources with sanitized URLs - data is always an array now
        sources: config.sources.map(source => ({
          ...source,
          data: source.data.map(item => ({
            ...item, // Spread ALL properties first to preserve arbitrary fields
            url: item.url ? sanitizeUrl(item.url) : item.url, // Override only url for sanitization
          })),
          // Preserve preview for base layers
          ...('preview' in source && source.preview ? { preview: source.preview } : {}),
          // Include statistics if they exist
          ...(source.statistics && {
            statistics: source.statistics.map(item => ({
              ...item, // Spread ALL properties first to preserve arbitrary fields
              url: item.url ? sanitizeUrl(item.url) : item.url, // Override only url for sanitization
            }))
          }),
          // Include constraints if they exist
          ...(source.constraints && {
            constraints: source.constraints.map(constraint => ({
              ...constraint, // Spread ALL properties to preserve any additional fields
              url: constraint.url ? sanitizeUrl(constraint.url) : constraint.url, // Override only url for sanitization
            }))
          })
        })),
      };

      // Apply sorting if requested
      if (options.sortToMatchUiOrder) {
        exportData.services = sortServices(exportData.services) as any;
        exportData.sources = sortSources(exportData.sources, config.interfaceGroups) as any;
        exportData.sources = exportData.sources.map(orderSourceProperties) as any;
      }

      // Apply export transformations
      const transformedConfig = applyExportTransformations(exportData, options);

      
      const configJson = JSON.stringify(transformedConfig, null, 2);
      const blob = new Blob([configJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'config.json';
      a.click();
      URL.revokeObjectURL(url);
      
      // Update last exported timestamp
      dispatch({ type: 'SET_LAST_EXPORTED' });
      
      const transformationsApplied = Object.values(options).some(value => value);
      const description = transformationsApplied 
        ? "Your config.json file has been downloaded with custom transformations applied."
        : "Your config.json file has been downloaded with sanitized URLs.";
      
      toast({
        title: "Configuration Exported",
        description,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "An error occurred while exporting the configuration.",
        variant: "destructive",
      });
    }
  }, [config, dispatch, toast]);

  return { exportConfig };
};
