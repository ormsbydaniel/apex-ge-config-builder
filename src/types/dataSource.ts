/**
 * Data source item and related configuration type definitions
 */

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
  // Allow arbitrary additional properties (e.g., env, styles, time, transparent)
  [key: string]: any;
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
  zIndex: number;
  service: string;
  label: string;
  // Allow arbitrary additional properties
  [key: string]: any;
}
