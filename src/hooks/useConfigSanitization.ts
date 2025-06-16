
import { useMemo } from 'react';
import { sanitizeUrl } from '@/utils/urlSanitizer';

export const useConfigSanitization = (config: any) => {
  const sanitizedConfig = useMemo(() => ({
    version: '1.0.0',
    layout: config.layout,
    interfaceGroups: config.interfaceGroups,
    exclusivitySets: config.exclusivitySets,
    services: config.services?.map((service: any) => ({
      ...service,
      url: sanitizeUrl(service.url)
    })) || [],
    sources: config.sources?.map((source: any) => ({
      ...source,
      data: source.data.map((item: any) => ({
        ...item,
        url: item.url ? sanitizeUrl(item.url) : item.url
      }))
    })) || [],
  }), [config]);

  const configJson = useMemo(() => 
    JSON.stringify(sanitizedConfig, null, 2), 
    [sanitizedConfig]
  );

  return { sanitizedConfig, configJson };
};
