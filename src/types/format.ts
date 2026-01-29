/**
 * Format and configuration type definitions
 */

// DataSourceFormat no longer includes 's3'
export type DataSourceFormat = 'wms' | 'wmts' | 'xyz' | 'wfs' | 'cog' | 'geojson' | 'flatgeobuf';

// Design configuration for global layout variants
export interface DesignConfig {
  variant: string;           // Required: the design variant (e.g., "fullscreen")
  parameters?: Record<string, unknown>;  // Optional: key-value pairs for variant parameters
}

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
