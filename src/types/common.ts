/**
 * Common TypeScript interfaces for shared prop patterns
 * Phase 1 Refactoring: Standardize common prop patterns across components
 */

import { DataSource, Service } from './config';

// Common configuration interface used across multiple hooks
export interface BaseConfigProps {
  sources: DataSource[];
  interfaceGroups: string[];
}

// Extended configuration interface with services and exclusivity sets
export interface ExtendedConfigProps extends BaseConfigProps {
  services: Service[];
  exclusivitySets: string[];
}

// Common update handler interface
export interface ConfigUpdateProps {
  updateConfig: (updates: { 
    interfaceGroups?: string[]; 
    sources?: DataSource[];
    services?: Service[];
    exclusivitySets?: string[];
  }) => void;
}

// Layer management callback interfaces
export interface LayerActionHandlers {
  onRemove: (index: number) => void;
  onEdit: (index: number) => void;
  onDuplicate: (index: number) => void;
  onUpdateLayer: (index: number, layer: DataSource) => void;
}

// Data source management callback interfaces  
export interface DataSourceActionHandlers {
  onAddDataSource: (layerIndex: number) => void;
  onRemoveDataSource: (layerIndex: number, dataSourceIndex: number) => void;
  onEditDataSource: (layerIndex: number, dataIndex: number) => void;
}

// Statistics management callback interfaces
export interface StatisticsActionHandlers {
  onRemoveStatisticsSource: (layerIndex: number, statsIndex: number) => void;
  onEditStatisticsSource: (layerIndex: number, statsIndex: number) => void;
}

// Combined action handlers for components that need all layer actions
export interface LayerManagementHandlers extends 
  LayerActionHandlers, 
  DataSourceActionHandlers, 
  StatisticsActionHandlers {
  onMoveLayer: (fromIndex: number, toIndex: number) => void;
}

// Expansion state interfaces
export interface ExpansionStateHandlers {
  expandedLayers: Set<number>;
  onToggleLayer: (index: number) => void;
}

// Form field configuration for reusable form components
export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'number';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: (value: any) => string | null;
}

// Common base props for components that handle layer editing
export interface LayerEditingProps {
  editingLayer?: DataSource;
  isEditing?: boolean;
}

// Common props for interface group management
export interface InterfaceGroupProps {
  interfaceGroups: string[];
  defaultInterfaceGroup?: string;
}