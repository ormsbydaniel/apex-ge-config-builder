
import React, { createContext, useContext } from 'react';
import { DataSource, LayerType, Service, LayerValidationResult } from '@/types/config';

interface LayersTabContextValue {
  config: {
    sources: DataSource[];
    interfaceGroups: string[];
    services: Service[];
    exclusivitySets: string[];
    validationResults?: Map<number, LayerValidationResult>;
  };
  editingLayerIndex: number | null;
  defaultInterfaceGroup?: string;
  // Action handlers
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
  children: React.ReactNode;
  value: LayersTabContextValue;
}

export const LayersTabProvider = ({ children, value }: LayersTabProviderProps) => {
  return (
    <LayersTabContext.Provider value={value}>
      {children}
    </LayersTabContext.Provider>
  );
};
