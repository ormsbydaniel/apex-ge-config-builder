
import { useMemo } from 'react';
import { sanitizeUrl } from '@/utils/urlSanitizer';

export const useConfigSanitization = (config: any) => {
  const sanitizedConfig = useMemo(() => {
    console.log('=== SANITIZATION HOOK RUNNING ===');
    console.log('useConfigSanitization running with config:', config);
    console.log('Config sources:', config.sources);
    console.log('First source controls:', config.sources?.[0]?.layout?.layerCard?.controls);
    return {
    version: '1.0.0',
    layout: config.layout,
    interfaceGroups: config.interfaceGroups,
    exclusivitySets: config.exclusivitySets,
    services: config.services?.map((service: any) => ({
      ...service,
      url: sanitizeUrl(service.url)
    })) || [],
    sources: config.sources?.map((source: any) => {
      console.log('Processing source in sanitization hook:', source.name);
      console.log('Source controls before sanitization:', source.layout?.layerCard?.controls);
      
      const result = {
        ...source,
        layout: {
          ...source.layout,
          ...(source.layout?.layerCard && {
            layerCard: {
              ...source.layout.layerCard,
              ...(source.layout.layerCard.controls && {
                controls: (() => {
                  const originalControls = source.layout.layerCard.controls;
                  console.log('Sanitizing controls for', source.name, ':', originalControls);
                  const sanitizedControls = {
                    ...originalControls,
                    ...(originalControls.download && {
                      download: sanitizeUrl(originalControls.download)
                    })
                  };
                  console.log('Sanitized controls:', sanitizedControls);
                  return sanitizedControls;
                })()
              })
            }
          })
        },
        data: source.data.map((item: any) => ({
          ...item,
          url: item.url ? sanitizeUrl(item.url) : item.url
        }))
      };
      
      console.log('Result after sanitization:', result.layout?.layerCard?.controls);
      return result;
    }) || [],
    };
  }, [config]);

  const configJson = useMemo(() => 
    JSON.stringify(sanitizedConfig, null, 2), 
    [sanitizedConfig]
  );

  return { sanitizedConfig, configJson };
};
