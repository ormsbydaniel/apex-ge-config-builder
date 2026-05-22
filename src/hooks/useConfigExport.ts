
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useConfig } from '@/contexts/ConfigContext';
import { sanitizeUrl } from '@/utils/urlSanitizer';
import { applyExportTransformations } from '@/utils/exportTransformations';
import { ExportOptions } from '@/components/ExportOptionsDialog';
import { sortSources, sortServices, orderSourceProperties } from '@/utils/configSorting';

const sanitizeFilenamePrefix = (prefix?: string): string => {
  const sanitized = (prefix || 'config')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '');

  return sanitized || 'config';
};

const getExportTimestamp = (): string => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');

  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
};

export const useConfigExport = () => {
  const { config, dispatch } = useConfig();
  const { toast } = useToast();

  const exportConfig = useCallback((options: ExportOptions = { 
    sortToMatchUiOrder: false
  }) => {
    try {
      
      // Create a clean config object without internal state and capabilities
      const exportData = {
        version: config.version || '1.0.0',
        exportPrefix: config.exportPrefix || 'config',
        layout: config.layout,
        interfaceGroups: config.interfaceGroups,
        exclusivitySets: config.exclusivitySets,
        ...(config.mapConstraints && { mapConstraints: config.mapConstraints }),
        ...(config.projections?.length && { projections: config.projections }),
        // Top-level workflows array — sanitise URLs inside any nested data/statistics
        ...((config as any).workflows && {
          workflows: (config as any).workflows.map((wf: any) => ({
            ...wf,
            ...(Array.isArray(wf.data) && {
              data: wf.data.map((item: any) => ({
                ...item,
                url: item.url ? sanitizeUrl(item.url) : item.url,
              })),
            }),
            ...(Array.isArray(wf.statistics) && {
              statistics: wf.statistics.map((item: any) => ({
                ...item,
                url: item.url ? sanitizeUrl(item.url) : item.url,
              })),
            }),
          })),
        }),
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
          }),
          // Include workflows if they exist — sanitise URLs nested in workflow data/statistics
          ...(source.workflows && {
            workflows: source.workflows.map((wf: any) => ({
              ...wf,
              ...(Array.isArray(wf.data) && {
                data: wf.data.map((item: any) => ({
                  ...item,
                  url: item.url ? sanitizeUrl(item.url) : item.url,
                })),
              }),
              ...(Array.isArray(wf.statistics) && {
                statistics: wf.statistics.map((item: any) => ({
                  ...item,
                  url: item.url ? sanitizeUrl(item.url) : item.url,
                })),
              }),
            })),
          })
        })),
      };

      // Apply sorting if requested
      if (options.sortToMatchUiOrder) {
        exportData.services = sortServices(exportData.services) as any;
        exportData.sources = sortSources(exportData.sources, config.interfaceGroups) as any;
        exportData.sources = exportData.sources.map(orderSourceProperties) as any;
      }

      // Apply export transformations (currently none, but kept for future use)
      const transformedConfig = applyExportTransformations(exportData, options);

      
      const configJson = JSON.stringify(transformedConfig, null, 2);
      const blob = new Blob([configJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const filename = `${sanitizeFilenamePrefix(config.exportPrefix)}_${getExportTimestamp()}.json`;
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      
      // Update last exported timestamp
      dispatch({ type: 'SET_LAST_EXPORTED' });
      
      const transformationsApplied = Object.values(options).some(value => value);
      const description = transformationsApplied 
        ? `${filename} has been downloaded with custom transformations applied.`
        : `${filename} has been downloaded with sanitized URLs.`;
      
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
