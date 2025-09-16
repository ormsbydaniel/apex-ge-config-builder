
import { useConfig } from '@/contexts/ConfigContext';
import { DataSource, Service, Category, DataSourceFormat } from '@/types/config';
import { validateImages } from '@/utils/imageValidation';

export const useValidatedConfig = () => {
  const { config, dispatch } = useConfig();

  // Ensure sources have required fields with defaults
  const validatedSources: DataSource[] = config.sources.map(source => {
    // Data is always an array now, so we can simplify validation
    const validatedData = source.data.map(dataItem => ({
      ...dataItem,
      format: dataItem.format || 'wms',
      zIndex: dataItem.zIndex ?? 0,
      url: dataItem.url || (dataItem.images?.[0]?.url) || '',
      // Ensure images array only contains items with valid URLs
      ...(dataItem.images && {
        images: validateImages(dataItem.images)
      })
    }));

    // Validate statistics array if it exists
    const validatedStatistics = source.statistics?.map(statItem => ({
      ...statItem,
      format: statItem.format || 'flatgeobuf',
      zIndex: statItem.zIndex ?? 0,
      url: statItem.url || (statItem.images?.[0]?.url) || '',
      level: statItem.level ?? 0,
      // Ensure images array only contains items with valid URLs
      ...(statItem.images && {
        images: validateImages(statItem.images)
      })
    }));

    // Enhanced base layer detection
    const isBaseLayer = source.isBaseLayer === true;

    const hasLegacyBaseLayer = source.data.some(d => d.isBaseLayer === true);
    const shouldBeBaseLayer = isBaseLayer || hasLegacyBaseLayer;
    
    const baseSource = {
      ...source,
      name: source.name || '',
      isActive: source.isActive ?? false,
      data: validatedData,
      // Set isBaseLayer at top level if detected from legacy format
      ...(shouldBeBaseLayer && { isBaseLayer: true }),
      // Include statistics if they exist
      ...(validatedStatistics && { statistics: validatedStatistics })
    };

    // For base layers (now detected at top level), meta and layout are optional
    if (shouldBeBaseLayer) {
      return {
        ...baseSource,
        isBaseLayer: true, // Ensure it's explicitly set
        ...(source.meta && {
          meta: {
            ...source.meta,
            description: source.meta.description || '',
            attribution: {
              text: source.meta.attribution?.text || '',
              url: source.meta.attribution?.url
            },
            categories: source.meta.categories?.map(cat => ({
              color: cat.color || '#000000',
              label: cat.label || '',
              // Preserve the value field if it exists, otherwise use 0 as default
              value: cat.value !== undefined ? cat.value : 0
            } as Category)) || [],
            // Include additional meta fields if present (including gradient fields)
            ...(source.meta.min !== undefined && { min: source.meta.min }),
            ...(source.meta.max !== undefined && { max: source.meta.max }),
            ...(source.meta.startColor && { startColor: source.meta.startColor }),
            ...(source.meta.endColor && { endColor: source.meta.endColor }),
            // Handle swipeConfig with backward compatibility
            ...(source.meta.swipeConfig && {
              swipeConfig: {
                clippedSourceName: source.meta.swipeConfig.clippedSourceName,
                // Handle backward compatibility: convert single baseSourceName to array
                baseSourceNames: source.meta.swipeConfig.baseSourceNames || 
                  ((source.meta.swipeConfig as any).baseSourceName ? [(source.meta.swipeConfig as any).baseSourceName] : [])
              }
            }),
            // Temporal configuration is now at top level - no need to move from meta
          }
        }),
        ...(source.layout && {
          layout: {
            ...source.layout,
            ...(source.layout.layerCard && {
              layerCard: {
                toggleable: source.layout.layerCard.toggleable ?? true,
                legend: source.layout.layerCard.legend ? {
                  type: source.layout.layerCard.legend.type || 'swatch',
                  ...(source.layout.layerCard.legend.url && { url: source.layout.layerCard.legend.url })
                } : undefined,
                controls: source.layout.layerCard.controls && typeof source.layout.layerCard.controls === 'object' && !Array.isArray(source.layout.layerCard.controls)
                  ? {
                      opacitySlider: (source.layout.layerCard.controls as any).opacitySlider,
                      zoomToCenter: (source.layout.layerCard.controls as any).zoomToCenter,
                      ...((source.layout.layerCard.controls as any).download && {
                        download: (source.layout.layerCard.controls as any).download
                      })
                    }
                  : { opacitySlider: true },
                showStatistics: source.layout.layerCard.showStatistics
              }
            })
          }
        })
      };
    }

    // For layer cards (non-base layers), ensure meta and layout are present
    const meta = {
      description: source.meta?.description || '',
      attribution: {
        text: source.meta?.attribution?.text || '',
        url: source.meta?.attribution?.url
      },
      categories: source.meta?.categories?.map(cat => ({
        color: cat.color || '#000000',
        label: cat.label || '',
        // Preserve the value field if it exists, otherwise use 0 as default
        value: cat.value !== undefined ? cat.value : 0
      } as Category)) || [],
      units: source.meta?.units,
      // Include additional meta fields if present (including gradient fields)
      ...(source.meta?.min !== undefined && { min: source.meta.min }),
      ...(source.meta?.max !== undefined && { max: source.meta.max }),
      ...(source.meta?.startColor && { startColor: source.meta.startColor }),
      ...(source.meta?.endColor && { endColor: source.meta.endColor }),
      // Handle swipeConfig with backward compatibility
      ...(source.meta?.swipeConfig && {
        swipeConfig: {
          clippedSourceName: source.meta.swipeConfig.clippedSourceName,
          // Handle backward compatibility: convert single baseSourceName to array
          baseSourceNames: source.meta.swipeConfig.baseSourceNames || 
            ((source.meta.swipeConfig as any).baseSourceName ? [(source.meta.swipeConfig as any).baseSourceName] : [])
        }
      }),
      // Temporal configuration is now at top level - no need to move from meta
    };

    return {
      ...baseSource,
      meta,
      layout: {
        interfaceGroup: source.layout?.interfaceGroup,
        layerCard: {
          toggleable: source.layout?.layerCard?.toggleable ?? true,
          legend: source.layout?.layerCard?.legend ? {
            type: source.layout.layerCard.legend.type || 'swatch',
            ...(source.layout.layerCard.legend.url && { url: source.layout.layerCard.legend.url })
          } : undefined,
          controls: source.layout?.layerCard?.controls && typeof source.layout.layerCard.controls === 'object' && !Array.isArray(source.layout.layerCard.controls)
            ? {
                opacitySlider: (source.layout.layerCard.controls as any).opacitySlider,
                zoomToCenter: (source.layout.layerCard.controls as any).zoomToCenter,
                ...((source.layout.layerCard.controls as any).download && {
                  download: (source.layout.layerCard.controls as any).download
                })
              }
            : { opacitySlider: true },
          showStatistics: source.layout?.layerCard?.showStatistics
        }
      }
    };
  });

  // Ensure services have required fields with defaults
  const validatedServices = (config.services || []).map(service => ({
    ...service,
    id: service.id || '',
    name: service.name || '',
    url: service.url || '',
    // Handle format - only set if it's a valid format or omit for S3
    ...(service.format && service.format !== 's3' && { format: service.format as DataSourceFormat }),
    // Ensure sourceType is set
    sourceType: service.sourceType || ('service' as const)
  })) as Service[];

  return {
    config: {
      ...config,
      sources: validatedSources,
      services: validatedServices,
      // Only add default mapConstraints if none exist
      mapConstraints: config.mapConstraints !== undefined 
        ? config.mapConstraints 
        : {
            zoom: 0,
            center: [0, 0]
          }
    },
    dispatch
  };
};
