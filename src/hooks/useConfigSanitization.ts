import { useMemo } from 'react';
import { sanitizeUrl } from '@/utils/urlSanitizer';

export const useConfigSanitization = (config: any) => {
  const sanitizedConfig = useMemo(() => ({
    version: '1.0.0',
    layout: config.layout,
    interfaceGroups: config.interfaceGroups,
    exclusivitySets: config.exclusivitySets,
    ...(config.mapConstraints && { mapConstraints: config.mapConstraints }),
    services: config.services?.map((service: any) => ({
      ...service,
      url: sanitizeUrl(service.url)
    })) || [],
    sources: config.sources?.map((source: any) => ({
      ...source,
      layout: {
        ...source.layout,
        ...(source.layout?.layerCard && {
          layerCard: {
            ...source.layout.layerCard,
            ...(source.layout.layerCard.controls && {
              controls: {
                ...source.layout.layerCard.controls,
                ...(source.layout.layerCard.controls.download && {
                  download: sanitizeUrl(source.layout.layerCard.controls.download)
                })
              }
            })
          }
        })
      },
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