
import { FormatConfig, DataSourceFormat } from '@/types/config';

// Removed s3 from FORMAT_CONFIGS - S3 is just a source location, not a format
export const FORMAT_CONFIGS: Record<DataSourceFormat, FormatConfig> = {
  cog: {
    label: 'COG (Cloud Optimized GeoTIFF)',
    urlPlaceholder: 'https://example.com/data.tif',
    layersPlaceholder: '',
    requiresLayers: false,
    supportsGetCapabilities: false,
  },
  wmts: {
    label: 'WMTS (Web Map Tile Service)',
    urlPlaceholder: 'https://services.terrascope.be/wmts/v2',
    layersPlaceholder: 'WORLDCOVER_2020_S2_TCC',
    requiresLayers: true,
    supportsGetCapabilities: true,
  },
  wms: {
    label: 'WMS (Web Map Service)',
    urlPlaceholder: 'https://services.terrascope.be/wms/v2',
    layersPlaceholder: 'WORLDCEREAL_WINTERCEREALS_V1',
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
  wfs: {
    label: 'WFS (Web Feature Service)',
    urlPlaceholder: 'https://services.terrascope.be/wfs/v2',
    layersPlaceholder: 'WORLDCOVER_FEATURES',
    requiresLayers: true,
    supportsGetCapabilities: true,
  }
};

// Add special handling for S3 bucket browsing
export const S3_CONFIG = {
  label: 'S3 Bucket Browser',
  urlPlaceholder: 'https://esa-apex.s3.eu-west-1.amazonaws.com/',
  description: 'Browse and select files from an S3 bucket. File format will be automatically detected.',
  supportsGetCapabilities: true // We'll fetch bucket contents
};

// Add special handling for STAC catalogues
export const STAC_CONFIG = {
  label: 'STAC Catalogue',
  urlPlaceholder: 'https://eoresults.esa.int/stac/',
  description: 'Connect to a STAC (Spatio Temporal Asset Catalogue) endpoint. Service name will be auto-populated from catalogue.',
  supportsGetCapabilities: true // We'll fetch catalogue metadata
};

// Add special handling for JSON or XML file uploads
export const FILE_UPLOAD_CONFIG = {
  label: 'JSON or XML File Upload (beta)',
  urlPlaceholder: 'Upload a JSON or XML file',
  description: 'Upload a file containing S3 bucket listing (XML/JSON), STAC catalog (JSON), or service capabilities',
  supportsGetCapabilities: false,
};

// Legacy export for backward compatibility
export const JSON_UPLOAD_CONFIG = FILE_UPLOAD_CONFIG;
