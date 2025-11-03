import React, { createContext, useContext, ReactNode } from 'react';
import { DataSource, Service, ConstraintSourceItem, WorkflowItem } from '@/types/config';

export interface LayersTabContextValue {
  config: {
    sources: DataSource[];
    interfaceGroups: string[];
    services: Service[];
    exclusivitySets: string[];
  };
  editingLayerIndex: number | null;
  handleEditLayer: (layerIndex: number) => void;
  handleEditBaseLayer: (layerIndex: number) => void;
  handleDuplicateLayer: (layerIndex: number) => void;
  handleRemoveDataSource: (layerIndex: number, dataIndex: number) => void;
  handleRemoveStatisticsSource: (layerIndex: number, statsIndex: number) => void;
  handleEditDataSource: (layerIndex: number, dataIndex: number) => void;
  handleEditStatisticsSource: (layerIndex: number, statsIndex: number) => void;
  handleStartDataSourceFormWithExpansion: (layerIndex: number, isAddingStatistics?: boolean) => void;
  handleDataSourcePositionSave: (layerIndex: number, dataSourceIndex: number, position: string) => void;
  handleStartConstraintFormWithExpansion: (layerIndex: number) => void;
  handleRemoveConstraintSource: (layerIndex: number, constraintIndex: number) => void;
  handleEditConstraintSource: (layerIndex: number, constraintIndex: number) => void;
  handleMoveConstraintUp: (layerIndex: number, constraintIndex: number) => void;
  handleMoveConstraintDown: (layerIndex: number, constraintIndex: number) => void;
  handleMoveConstraintToTop: (layerIndex: number, constraintIndex: number) => void;
  handleMoveConstraintToBottom: (layerIndex: number, constraintIndex: number) => void;
  handleReorderDataSource: (layerIndex: number, fromIndex: number, toIndex: number) => void;
  handleReorderStatisticsSource: (layerIndex: number, fromIndex: number, toIndex: number) => void;
  handleAddWorkflow: (layerIndex: number, workflow: WorkflowItem) => void;
  handleRemoveWorkflow: (layerIndex: number, workflowIndex: number) => void;
  handleUpdateWorkflow: (layerIndex: number, workflowIndex: number, workflow: WorkflowItem) => void;
  handleMoveWorkflowUp: (layerIndex: number, workflowIndex: number) => void;
  handleMoveWorkflowDown: (layerIndex: number, workflowIndex: number) => void;
  handleMoveWorkflowToTop: (layerIndex: number, workflowIndex: number) => void;
  handleMoveWorkflowToBottom: (layerIndex: number, workflowIndex: number) => void;
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
