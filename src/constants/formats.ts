
import { FormatConfig, DataSourceFormat } from '@/types/config';

export const FORMAT_CONFIGS: Record<DataSourceFormat, FormatConfig> = {
  wms: {
    label: 'WMS (Web Map Service)',
    urlPlaceholder: 'https://services.terrascope.be/wms/v2',
    layersPlaceholder: 'WORLDCEREAL_WINTERCEREALS_V1',
    requiresLayers: true,
    supportsGetCapabilities: true,
  },
  wmts: {
    label: 'WMTS (Web Map Tile Service)',
    urlPlaceholder: 'https://services.terrascope.be/wmts/v2',
    layersPlaceholder: 'WORLDCOVER_2020_S2_TCC',
    requiresLayers: true,
    supportsGetCapabilities: true,
  },
  xyz: {
    label: 'XYZ (Tile Service)',
    urlPlaceholder: 'https://example.com/tiles/{z}/{x}/{y}.png',
    layersPlaceholder: '',
    requiresLayers: false,
    supportsGetCapabilities: false,
  },
  wfs: {
    label: 'WFS (Web Feature Service)',
    urlPlaceholder: 'https://services.terrascope.be/wfs/v2',
    layersPlaceholder: 'WORLDCOVER_FEATURES',
    requiresLayers: true,
    supportsGetCapabilities: true,
  },
  cog: {
    label: 'COG (Cloud Optimized GeoTIFF)',
    urlPlaceholder: 'https://example.com/data.tif',
    layersPlaceholder: '',
    requiresLayers: false,
    supportsGetCapabilities: false,
  },
  geojson: {
    label: 'GeoJSON',
    urlPlaceholder: 'https://example.com/data.geojson',
    layersPlaceholder: '',
    requiresLayers: false,
    supportsGetCapabilities: false,
  },
  flatgeobuf: {
    label: 'FlatGeoBuf',
    urlPlaceholder: '/worldcover-stats-nuts.level00.fgb',
    layersPlaceholder: '',
    requiresLayers: false,
    supportsGetCapabilities: false,
  },
  s3: {
    label: 'S3 Bucket',
    urlPlaceholder: 'https://esa-apex.s3.eu-west-1.amazonaws.com/',
    layersPlaceholder: '',
    requiresLayers: false,
    supportsGetCapabilities: true, // We'll fetch bucket contents
  },
};
