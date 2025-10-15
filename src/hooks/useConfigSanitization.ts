import { useMemo } from 'react';
import { sanitizeUrl } from '@/utils/urlSanitizer';

export const useConfigSanitization = (config: any) => {
  const sanitizedConfig = useMemo(() => ({
    version: config.version || '1.0.0',
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
      // Preserve meta field including colormaps
      ...(source.meta && { meta: source.meta }),
      // Preserve statistics field
      ...(source.statistics && { statistics: source.statistics }),
      layout: {
        ...source.layout,
        // Preserve contentLocation
        ...(source.layout?.contentLocation && { contentLocation: source.layout.contentLocation }),
        // Preserve layerCard with all controls
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
        }),
        // Preserve infoPanel with all controls
        ...(source.layout?.infoPanel && {
          infoPanel: {
            ...source.layout.infoPanel,
            ...(source.layout.infoPanel.controls && {
              controls: {
                ...source.layout.infoPanel.controls,
                ...(source.layout.infoPanel.controls.download && {
                  download: sanitizeUrl(source.layout.infoPanel.controls.download)
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