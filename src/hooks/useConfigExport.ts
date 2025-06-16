
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useConfig } from '@/contexts/ConfigContext';
import { sanitizeUrl } from '@/utils/urlSanitizer';

export const useConfigExport = () => {
  const { config } = useConfig();
  const { toast } = useToast();

  const exportConfig = useCallback(() => {
    try {
      // Create a clean config object without internal state and capabilities
      const exportData = {
        version: '1.0.0',
        layout: config.layout,
        interfaceGroups: config.interfaceGroups,
        exclusivitySets: config.exclusivitySets,
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
            ...item,
            url: item.url ? sanitizeUrl(item.url) : item.url,
            format: item.format,
            zIndex: item.zIndex
          }))
        })),
      };

      console.log('Exporting config with sanitized URLs');
      const configJson = JSON.stringify(exportData, null, 2);
      const blob = new Blob([configJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'config.json';
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Configuration Exported",
        description: "Your config.json file has been downloaded with sanitized URLs.",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "An error occurred while exporting the configuration.",
        variant: "destructive",
      });
    }
  }, [config, toast]);

  return { exportConfig };
};
