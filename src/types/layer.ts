/**
 * Layer type definitions including meta, layout, and data source types
 */

import { Category, Colormap } from './category';
import { DataField, SwipeConfig, TimeframeType, ConstraintSourceItem, WorkflowItem, DataSourceItem } from './dataSource';

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
      blendControls?: boolean;
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
      blendControls?: boolean;
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
