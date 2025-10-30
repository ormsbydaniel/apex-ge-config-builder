export interface Category {
  color: string;
  label: string;
  value: number;
}

export interface Colormap {
  min: number;
  max: number;
  steps: number;
  name: string;
  reverse: boolean;
}

// Service interface - simplified to avoid discriminated union issues
export interface Service {
  id: string;
  name: string;
  url: string;
  sourceType?: 's3' | 'service' | 'stac'; // Optional, defaults to 'service'
  format?: DataSourceFormat | 's3' | 'stac'; // Optional for S3/STAC services, required for others
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
  hasTimeDimension?: boolean;
  defaultTime?: string;
  crs?: string[];
  bbox?: {
    west: string;
    east: string;
    south: string;
    north: string;
  };
  hasLegendGraphic?: boolean;
  legendGraphicUrl?: string;
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
  // Zoom level constraints
  minZoom?: number;
  maxZoom?: number;
  // Temporal support
  timestamps?: number[]; // Array of Unix timestamps
  useTimeParameter?: boolean; // Use TIME parameter from WMS/WMTS service
  // Opacity support (0-1 range)
  opacity?: number;
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

// Temporal configuration
export type TimeframeType = 'None' | 'Days' | 'Months' | 'Years';

export interface TemporalConfig {
  timeframe: TimeframeType;
  defaultTimestamp?: number; // Default timestamp when timeframe is not 'None'
}

// Constraint source configuration
export interface ConstraintSourceItem {
  url: string;
  format: 'cog'; // Only COG supported for constraints
  label: string; // Display name for the constraint
  type: 'continuous' | 'categorical' | 'combined'; // Constraint type
  interactive: boolean; // Whether user can control this constraint
  // For continuous constraints
  min?: number;
  max?: number;
  units?: string;
  // For categorical constraints (values only) or combined (named ranges with min/max)
  constrainTo?: Array<{ label: string; value: number }> | Array<{ label: string; min: number; max: number }>;
  // Band selection
  bandIndex?: number;
}

// Workflow configuration
export interface WorkflowItem {
  id: string;
  name: string;
  endpoint: string; // Processing endpoint URL
  parameters: Record<string, any>; // Flexible parameter object
  enabled: boolean;
}

// Enhanced meta interface
export interface DataSourceMeta {
  description?: string;
  attribution: {
    text: string;
    url?: string;
  };
  categories?: Category[];
  colormaps?: Colormap[];
  units?: string;
  // Additional fields for color ramps and statistics
  min?: number;
  max?: number;
  startColor?: string;
  endColor?: string;
  // Swipe layer configuration
  swipeConfig?: SwipeConfig;
  // Temporal configuration - flat structure
  timeframe?: TimeframeType;
  defaultTimestamp?: number;
}

// Enhanced layout interface with support for both layerCard and infoPanel
// NOTE: layerCard is REQUIRED and always contains toggleable
// Only legend and controls move between layerCard and infoPanel based on contentLocation
export interface DataSourceLayout {
  interfaceGroup?: string;
  contentLocation?: 'layerCard' | 'infoPanel'; // Track where legend/controls are stored
  layerCard: { // REQUIRED - always exists
    toggleable?: boolean; // Always lives here
    legend?: {
      type: 'swatch' | 'gradient' | 'image';
      url?: string;
    };
    controls?: {
      opacitySlider?: boolean;
      zoomToCenter?: boolean;
      download?: string;
      temporalControls?: boolean;
      constraintSlider?: boolean;
    };
    showStatistics?: boolean;
  };
  infoPanel?: {
    legend?: {
      type?: 'swatch' | 'gradient' | 'image';
      url?: string;
    };
    controls?: {
      opacitySlider?: boolean;
      zoomToCenter?: boolean;
      download?: string;
      temporalControls?: boolean;
      constraintSlider?: boolean;
    } | string[]; // Support both object and array for backward compatibility
  };
}

// Base interface with common required fields
interface BaseDataSource {
  name: string;
  isActive: boolean;
  data: DataField;
  statistics?: DataSourceItem[]; // Add statistics array
  constraints?: ConstraintSourceItem[]; // Add constraints array
  workflows?: WorkflowItem[]; // Add workflows array
  hasFeatureStatistics?: boolean;
  isBaseLayer?: boolean; // Add isBaseLayer as optional to base interface
  exclusivitySets?: string[]; // Array of exclusivity set names this layer belongs to
  // Temporal configuration at top level
  timeframe?: TimeframeType;
  defaultTimestamp?: number;
}

// Base layer type (meta and layout are optional, isBaseLayer is required)
export interface BaseLayer extends BaseDataSource {
  isBaseLayer: true; // NEW: Base layers now have this at the top level
  preview?: string; // Preview image URL for base layers
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

// URL and Layer Validation Types
export interface UrlValidationResult {
  url: string;
  type: 'data' | 'statistics';
  format?: string;
  layers?: string;
  status: 'valid' | 'error' | 'checking' | 'not-validated' | 'skipped';
  statusCode?: number;
  error?: string;
  validationType?: 'head-request' | 'get-capabilities' | 'skipped' | 'service-lookup';
}

export interface LayerValidationResult {
  layerName: string;
  overallStatus: 'valid' | 'partial' | 'error' | 'checking' | 'not-validated';
  urlResults: UrlValidationResult[];
  checkedAt?: Date;
}
