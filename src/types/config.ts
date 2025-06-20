export interface Category {
  color: string;
  label: string;
  value: number;
}

export interface Service {
  id: string;
  name: string;
  url: string;
  format: DataSourceFormat;
  capabilities?: ServiceCapabilities;
}

export interface ServiceCapabilities {
  layers: LayerInfo[];
  title?: string;
  abstract?: string;
}

export interface LayerInfo {
  name: string;
  title?: string;
  abstract?: string;
  boundingBox?: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
}

export interface DataSourceItem {
  url?: string;
  format: string;
  zIndex: number;
  isBaseLayer?: boolean; // Keep for backward compatibility during import
  layers?: string;
  level?: number;
  type?: string;
  serviceId?: string;
  // Additional fields for enhanced data sources
  normalize?: boolean;
  style?: any;
  images?: Array<{ url: string }>;
  // Position field for comparison layers (swipe, mirror, spotlight)
  position?: 'left' | 'right' | 'background' | 'spotlight';
}

// Simplified - data is always an array
export type DataField = DataSourceItem[];

// Type guard function (simplified)
export function isDataSourceItemArray(data: DataField): data is DataSourceItem[] {
  return Array.isArray(data);
}

// Updated Swipe configuration interface to support multiple base sources
export interface SwipeConfig {
  clippedSourceName: string;
  baseSourceNames: string[]; // Changed from baseSourceName to array
}

// Enhanced meta interface
export interface DataSourceMeta {
  description: string;
  attribution: {
    text: string;
    url?: string;
  };
  categories?: Category[];
  units?: string;
  // Additional fields for color ramps and statistics
  min?: number;
  max?: number;
  startColor?: string;
  endColor?: string;
  // Swipe layer configuration
  swipeConfig?: SwipeConfig;
}

// Enhanced layout interface
export interface DataSourceLayout {
  interfaceGroup?: string;
  layerCard?: {
    toggleable?: boolean;
    legend?: {
      type: 'swatch' | 'gradient' | 'image';
      url?: string;
    };
    controls?: {
      opacitySlider?: boolean;
    };
    showStatistics?: boolean;
  };
}

// Base interface with common required fields
interface BaseDataSource {
  name: string;
  isActive: boolean;
  data: DataField;
  statistics?: DataSourceItem[]; // Add statistics array
  hasFeatureStatistics?: boolean;
  isBaseLayer?: boolean; // Add isBaseLayer as optional to base interface
}

// Base layer type (meta and layout are optional, isBaseLayer is required)
export interface BaseLayer extends BaseDataSource {
  isBaseLayer: true; // NEW: Base layers now have this at the top level
  meta?: DataSourceMeta;
  layout?: DataSourceLayout;
}

// Layer card type (meta and layout are required, isBaseLayer is optional)
export interface LayerCard extends BaseDataSource {
  isBaseLayer?: false; // Layer cards can have isBaseLayer: false or undefined
  meta: DataSourceMeta;
  layout: DataSourceLayout;
}

// Flexible layer type (for layers that don't fit strict patterns)
export interface FlexibleLayer extends BaseDataSource {
  isBaseLayer?: boolean; // Optional for flexible layers
  meta?: DataSourceMeta;
  layout?: DataSourceLayout;
}

// Union type for DataSource
export type DataSource = BaseLayer | LayerCard | FlexibleLayer;

export type DataSourceFormat = 'wms' | 'wmts' | 'xyz' | 'wfs' | 'cog' | 'geojson' | 'flatgeobuf' | 's3';

export type LayerType = 'base' | 'layerCard' | 'swipe';

export interface FormatConfig {
  label: string;
  urlPlaceholder: string;
  layersPlaceholder: string;
  requiresLayers: boolean;
  supportsGetCapabilities: boolean;
}

export interface SourceFormProps {
  interfaceGroups: string[];
  services: Service[];
  onAddSource: (source: DataSource) => void;
  onAddService: (service: Service) => void;
  onCancel: () => void;
}

export interface ValidationErrorDetails {
  field: string;
  message: string;
  code: string;
  path: (string | number)[];
}

export interface ConfigValidationResult {
  isValid: boolean;
  errors: ValidationErrorDetails[];
  config?: any;
}
