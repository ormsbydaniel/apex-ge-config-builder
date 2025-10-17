import { useEffect } from 'react';
import { useConfig } from '@/contexts/ConfigContext';
import { sanitizeUrl } from '@/utils/urlSanitizer';
import { applyExportTransformations } from '@/utils/exportTransformations';

const ConfigJson = () => {
  const { config } = useConfig();

  useEffect(() => {
    // Set content type hint
    document.title = 'config.json';
  }, []);

  // Create export data (same logic as useConfigExport)
  const exportData = {
    version: config.version || '1.0.0',
    layout: config.layout,
    interfaceGroups: config.interfaceGroups,
    exclusivitySets: config.exclusivitySets,
    ...(config.mapConstraints && { mapConstraints: config.mapConstraints }),
    services: config.services.map(service => ({
      id: service.id,
      name: service.name,
      url: sanitizeUrl(service.url),
      format: service.format
    })),
    sources: config.sources.map(source => ({
      ...source,
      data: source.data.map(item => ({
        ...item,
        url: item.url ? sanitizeUrl(item.url) : item.url,
        format: item.format,
        zIndex: item.zIndex,
        ...(item.minZoom !== undefined && { minZoom: item.minZoom }),
        ...(item.maxZoom !== undefined && { maxZoom: item.maxZoom }),
        ...(item.normalize !== undefined && { normalize: item.normalize })
      })),
      ...('preview' in source && source.preview ? { preview: source.preview } : {}),
      ...(source.statistics && {
        statistics: source.statistics.map(item => ({
          ...item,
          url: item.url ? sanitizeUrl(item.url) : item.url,
          format: item.format,
          zIndex: item.zIndex,
          ...(item.minZoom !== undefined && { minZoom: item.minZoom }),
          ...(item.maxZoom !== undefined && { maxZoom: item.maxZoom }),
          ...(item.normalize !== undefined && { normalize: item.normalize })
        }))
      })
    })),
  };

  // Apply default export transformations
  const transformedConfig = applyExportTransformations(exportData, {
    singleItemArrayToObject: false,
    configureCogsAsImages: false,
    removeEmptyCategories: false,
    includeCategoryValues: true,
    addNormalizeFalseToCogs: false,
    transformSwipeLayersToData: false,
    changeFormatToType: false
  });

  const configJson = JSON.stringify(transformedConfig, null, 2);

  return (
    <pre style={{ 
      margin: 0, 
      fontFamily: 'monospace', 
      fontSize: '12px',
      whiteSpace: 'pre-wrap',
      wordWrap: 'break-word'
    }}>
      {configJson}
    </pre>
  );
};

export default ConfigJson;
