/**
 * Format and configuration type definitions
 */

// DataSourceFormat no longer includes 's3'
export type DataSourceFormat = 'wms' | 'wmts' | 'xyz' | 'wfs' | 'cog' | 'geojson' | 'flatgeobuf';

// New type for source configuration (includes S3 and STAC)
export type SourceConfigType = DataSourceFormat | 's3' | 'stac';

export type LayerType = 'base' | 'layerCard';

export interface FormatConfig {
  label: string;
  urlPlaceholder: string;
  layersPlaceholder: string;
  requiresLayers: boolean;
  supportsGetCapabilities: boolean;
}
