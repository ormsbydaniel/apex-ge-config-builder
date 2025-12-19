import React, { createContext, useContext, ReactNode } from 'react';
import { DataSource, Service, ConstraintSourceItem, WorkflowItem } from '@/types/config';
import { ChartConfig } from '@/types/chart';

export interface LayersTabContextValue {
  config: {
    sources: DataSource[];
    interfaceGroups: string[];
    services: Service[];
    exclusivitySets: string[];
  };
  editingLayerIndex: number | null;
  defaultInterfaceGroup?: string;
  // Layer actions
  onRemoveLayer: (index: number) => void;
  onEditLayer: (index: number) => void;
  onEditBaseLayer: (index: number) => void;
  onDuplicateLayer: (index: number) => void;
  onMoveLayer: (fromIndex: number, toIndex: number) => void;
  moveLayerToTop: (layerIndex: number, groupIndices: number[]) => void;
  moveLayerToBottom: (layerIndex: number, groupIndices: number[]) => void;
  onUpdateLayer: (index: number, layer: DataSource) => void;
  onAddLayer: (layer: DataSource) => void;
  onUpdateConfig: (updates: { interfaceGroups?: string[]; sources?: DataSource[] }) => void;
  // Data source actions
  onAddDataSource: (layerIndex: number) => void;
  onRemoveDataSource: (layerIndex: number, dataSourceIndex: number) => void;
  onRemoveStatisticsSource: (layerIndex: number, statsIndex: number) => void;
  onEditDataSource: (layerIndex: number, dataIndex: number) => void;
  onEditStatisticsSource: (layerIndex: number, statsIndex: number) => void;
  onAddStatisticsSource: (layerIndex: number) => void;
  onAddConstraintSource?: (layerIndex: number) => void;
  onRemoveConstraintSource: (layerIndex: number, constraintIndex: number) => void;
  onEditConstraintSource: (layerIndex: number, constraintIndex: number) => void;
  onMoveConstraintUp: (layerIndex: number, constraintIndex: number) => void;
  onMoveConstraintDown: (layerIndex: number, constraintIndex: number) => void;
  onMoveConstraintToTop: (layerIndex: number, constraintIndex: number) => void;
  onMoveConstraintToBottom: (layerIndex: number, constraintIndex: number) => void;
  // Workflow actions
  onAddWorkflow: (layerIndex: number, workflow: WorkflowItem) => void;
  onRemoveWorkflow: (layerIndex: number, workflowIndex: number) => void;
  onUpdateWorkflow: (layerIndex: number, workflowIndex: number, workflow: WorkflowItem) => void;
  onMoveWorkflowUp: (layerIndex: number, workflowIndex: number) => void;
  onMoveWorkflowDown: (layerIndex: number, workflowIndex: number) => void;
  onMoveWorkflowToTop: (layerIndex: number, workflowIndex: number) => void;
  onMoveWorkflowToBottom: (layerIndex: number, workflowIndex: number) => void;
  // Chart actions
  onAddChart: (layerIndex: number, chart: ChartConfig) => void;
  onRemoveChart: (layerIndex: number, chartIndex: number) => void;
  onUpdateChart: (layerIndex: number, chartIndex: number, chart: ChartConfig) => void;
}

const LayersTabContext = createContext<LayersTabContextValue | null>(null);

export const useLayersTabContext = () => {
  const context = useContext(LayersTabContext);
  if (!context) {
    throw new Error('useLayersTabContext must be used within a LayersTabProvider');
  }
  return context;
};

interface LayersTabProviderProps {
  children: ReactNode;
  value: LayersTabContextValue;
}

export const LayersTabProvider = ({ children, value }: LayersTabProviderProps) => {
  return (
    <LayersTabContext.Provider value={value}>
      {children}
    </LayersTabContext.Provider>
  );
};
