import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Service, DataSource, DataSourceItem, DataSourceFormat } from '@/types/config';
import { ValidatedConfiguration } from '@/schemas/configSchema';
import { sanitizeUrl } from '@/utils/urlSanitizer';
import { validateImages } from '@/utils/imageValidation';

interface ConfigState extends ValidatedConfiguration {
  isLoading: boolean;
  lastSaved: Date | null;
}

type ConfigAction =
  | { type: 'LOAD_CONFIG'; payload: ValidatedConfiguration }
  | { type: 'RESET_CONFIG' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_LAYOUT'; payload: { field: string; value: string } }
  | { type: 'UPDATE_INTERFACE_GROUPS'; payload: string[] }
  | { type: 'UPDATE_EXCLUSIVITY_SETS'; payload: string[] }
  | { type: 'UPDATE_MAP_CONSTRAINTS'; payload: { zoom?: number; center?: [number, number] } }
  | { type: 'ADD_SERVICE'; payload: Service }
  | { type: 'REMOVE_SERVICE'; payload: number }
  | { type: 'ADD_SOURCE'; payload: DataSource }
  | { type: 'REMOVE_SOURCE'; payload: number }
  | { type: 'UPDATE_SOURCE'; payload: { index: number; source: DataSource } }
  | { type: 'UPDATE_SOURCES'; payload: DataSource[] };

const initialState: ConfigState = {
  version: '1.0.0',
  layout: {
    navigation: {
      logo: "https://www.esa.int/extension/pillars/design/pillars/images/ESA_Logo.svg",
      title: "Geospatial Explorer - Custom Config"
    }
  },
  interfaceGroups: ["Interface group 1", "Interface group 2", "Interface group 3"],
  exclusivitySets: ["basemaps"],
  services: [],
  sources: [],
  mapConstraints: {
    zoom: 0,
    center: [0, 0]
  },
  isLoading: false,
  lastSaved: null,
};

// Helper function to normalize legacy data to always be arrays
const normalizeDataToArray = (data: any): DataSourceItem[] => {
  if (Array.isArray(data)) {
    return data.map(item => ({
      ...item,
      format: item.format || 'wms',
      zIndex: item.zIndex ?? 0,
      url: item.url || (item.images?.[0]?.url) || '',
      // Filter images to only include those with valid URLs
      ...(item.images && {
        images: validateImages(item.images)
      })
    }));
  } else if (data && typeof data === 'object') {
    // Convert single objects or special structures to arrays
    if (data.type === 'swipe') {
      // For comparison data, create a placeholder array item
      return [{
        format: 'comparison',
        zIndex: 0,
        type: data.type,
        url: `swipe:${data.clippedSource}:${data.baseSources.join(',')}`
      }];
    } else {
      // Convert single data source to array
      return [{
        ...data,
        url: data.url || '',
        format: data.format || 'wms',
        zIndex: data.zIndex ?? 0,
        // Filter images to only include those with valid URLs
        ...(data.images && {
          images: validateImages(data.images)
        })
      }];
    }
  }
  return [];
};

function configReducer(state: ConfigState, action: ConfigAction): ConfigState {
  switch (action.type) {
    case 'LOAD_CONFIG':
      // Normalize all data fields to arrays when loading and preserve statistics
      const normalizedPayload = {
        ...action.payload,
        services: action.payload.services || [],
        // Only add default mapConstraints if none exist in the imported config
        mapConstraints: action.payload.mapConstraints !== undefined 
          ? action.payload.mapConstraints 
          : {
              zoom: 0,
              center: [0, 0]
            },
        sources: action.payload.sources.map(source => ({
          ...source,
          data: normalizeDataToArray(source.data),
          // Preserve statistics array if it exists
          ...(source.statistics && { statistics: source.statistics })
        }))
      };
      
      return {
        ...normalizedPayload,
        isLoading: false,
        lastSaved: new Date(),
      };
    case 'RESET_CONFIG':
      return {
        ...initialState,
        lastSaved: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'UPDATE_LAYOUT':
      return {
        ...state,
        layout: {
          ...state.layout,
          navigation: {
            ...state.layout.navigation,
            [action.payload.field]: action.payload.value,
          },
        },
      };
    case 'UPDATE_INTERFACE_GROUPS':
      return {
        ...state,
        interfaceGroups: action.payload,
      };
    case 'UPDATE_EXCLUSIVITY_SETS':
      return {
        ...state,
        exclusivitySets: action.payload,
      };
    case 'UPDATE_MAP_CONSTRAINTS':
      return {
        ...state,
        mapConstraints: {
          ...state.mapConstraints,
          ...action.payload,
        },
      };
    case 'ADD_SERVICE':
      return {
        ...state,
        services: [...state.services, action.payload],
      };
    case 'REMOVE_SERVICE': {
      const serviceToRemove = state.services[action.payload];
      const updatedServices = state.services.filter((_, i) => i !== action.payload);
      
      // Remove service references from sources (both data and statistics)
      const updatedSources = state.sources.map(source => ({
        ...source,
        data: source.data.map(dataItem => {
          if (dataItem.serviceId === serviceToRemove.id) {
            // Create a clean data item without serviceId, ensuring all required fields
            const updatedItem: DataSourceItem = {
              url: dataItem.url || '',
              format: dataItem.format || 'wms',
              zIndex: dataItem.zIndex ?? 0,
            };
            
            // Add optional fields if they exist
            if (dataItem.isBaseLayer !== undefined) updatedItem.isBaseLayer = dataItem.isBaseLayer;
            if (dataItem.layers) updatedItem.layers = dataItem.layers;
            if (dataItem.level !== undefined) updatedItem.level = dataItem.level;
            if (dataItem.type) updatedItem.type = dataItem.type;
            if (dataItem.normalize !== undefined) updatedItem.normalize = dataItem.normalize;
            if (dataItem.style) updatedItem.style = dataItem.style;
            if (dataItem.images) updatedItem.images = validateImages(dataItem.images);
            
            return updatedItem;
          }
          return dataItem;
        }),
        // Also clean up statistics array if it exists
        ...(source.statistics && {
          statistics: source.statistics.map(statItem => {
            if (statItem.serviceId === serviceToRemove.id) {
              const updatedStatItem: DataSourceItem = {
                url: statItem.url || '',
                format: statItem.format || 'flatgeobuf',
                zIndex: statItem.zIndex ?? 0,
              };
              
              // Add optional fields if they exist
              if (statItem.level !== undefined) updatedStatItem.level = statItem.level;
              if (statItem.type) updatedStatItem.type = statItem.type;
              if (statItem.normalize !== undefined) updatedStatItem.normalize = statItem.normalize;
              if (statItem.style) updatedStatItem.style = statItem.style;
              if (statItem.images) updatedStatItem.images = validateImages(statItem.images);
              
              return updatedStatItem;
            }
            return statItem;
          })
        })
      }));
      
      return {
        ...state,
        services: updatedServices,
        sources: updatedSources,
      };
    }
    case 'ADD_SOURCE': {
      // Debug: Track colormaps in ADD_SOURCE action
      console.log('ConfigContext ADD_SOURCE: Original payload meta:', action.payload.meta);
      console.log('ConfigContext ADD_SOURCE: Original payload meta colormaps:', action.payload.meta?.colormaps);
      
      // Sanitize URLs and ensure data is array, preserve meta, statistics and controls
      const sanitizedSource = {
        ...action.payload,
        data: action.payload.data.map(item => ({
          ...item,
          url: item.url ? sanitizeUrl(item.url) : item.url
        })),
        // Preserve meta field completely
        ...(action.payload.meta && {
          meta: action.payload.meta
        }),
        // Preserve layout structure completely, including controls
        ...(action.payload.layout && {
          layout: {
            ...action.payload.layout,
            ...(action.payload.layout.layerCard && {
              layerCard: {
                ...action.payload.layout.layerCard,
                ...(action.payload.layout.layerCard.controls && {
                  controls: {
                    ...action.payload.layout.layerCard.controls,
                    ...(action.payload.layout.layerCard.controls.download && {
                      download: sanitizeUrl(action.payload.layout.layerCard.controls.download)
                    })
                  }
                })
              }
            })
          }
        }),
        // Sanitize statistics URLs if they exist
        ...(action.payload.statistics && {
          statistics: action.payload.statistics.map(item => ({
            ...item,
            url: item.url ? sanitizeUrl(item.url) : item.url
          }))
        })
      };
      
      // Debug: Track colormaps after sanitization
      console.log('ConfigContext ADD_SOURCE: Sanitized source meta:', sanitizedSource.meta);
      console.log('ConfigContext ADD_SOURCE: Sanitized source meta colormaps:', sanitizedSource.meta?.colormaps);
      
      return {
        ...state,
        sources: [...state.sources, sanitizedSource],
      };
    }
    case 'REMOVE_SOURCE':
      return {
        ...state,
        sources: state.sources.filter((_, i) => i !== action.payload),
      };
    case 'UPDATE_SOURCE': {
      const updatedSources = [...state.sources];
      updatedSources[action.payload.index] = action.payload.source;
      return {
        ...state,
        sources: updatedSources,
      };
    }
    case 'UPDATE_SOURCES': {
      // Debug: Track colormaps in UPDATE_SOURCES action
      console.log('ConfigContext UPDATE_SOURCES: Original payload sources with colormaps:', action.payload.map(s => ({ name: s.name, meta: s.meta, colormaps: s.meta?.colormaps })));
      
      // Sanitize URLs in all sources before updating, including statistics and controls
      const sanitizedSources = action.payload.map(source => ({
        ...source,
        data: source.data.map(item => ({
          ...item,
          url: item.url ? sanitizeUrl(item.url) : item.url
        })),
        // Always preserve layout structure completely
        ...(source.layout && {
          layout: {
            ...source.layout,
            ...(source.layout.layerCard && {
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
          }
        }),
        // Always preserve meta field completely
        ...(source.meta && {
          meta: source.meta
        }),
        // Sanitize statistics URLs if they exist
        ...(source.statistics && {
          statistics: source.statistics.map(item => ({
            ...item,
            url: item.url ? sanitizeUrl(item.url) : item.url
          }))
        })
      }));
      
      return {
        ...state,
        sources: sanitizedSources,
      };
    }
    default:
      return state;
  }
}

interface ConfigContextType {
  config: ConfigState;
  dispatch: React.Dispatch<ConfigAction>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, dispatch] = useReducer(configReducer, initialState);

  return (
    <ConfigContext.Provider value={{ config, dispatch }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};
