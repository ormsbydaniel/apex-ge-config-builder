
import React from 'react';
import { DataSource, LayerType, Service } from '@/types/config';
import { LayersTabProvider } from '@/contexts/LayersTabContext';
import LayersTabCore from './LayersTabCore';
import { useLayersTabLogic } from '@/hooks/useLayersTabLogic';

interface LayersTabContainerProps {
  config: {
    sources: DataSource[];
    interfaceGroups: string[];
    services: Service[];
    exclusivitySets: string[];
  };
  showLayerForm: boolean;
  selectedLayerType: LayerType | null;
  defaultInterfaceGroup?: string;
  setShowLayerForm: (show: boolean) => void;
  setSelectedLayerType: (type: LayerType | null) => void;
  setDefaultInterfaceGroup: (group: string | undefined) => void;
  handleLayerTypeSelect: (type: LayerType) => void;
  handleCancelLayerForm: () => void;
  addLayer: (layer: DataSource) => void;
  removeLayer: (index: number) => void;
  addService: (service: Service) => void;
  updateLayer: (index: number, layer: DataSource) => void;
  editingLayerIndex: number | null;
  setEditingLayerIndex: (index: number | null) => void;
  moveLayer: (fromIndex: number, toIndex: number) => void;
  updateConfig: (updates: { interfaceGroups?: string[]; sources?: DataSource[] }) => void;
  addExclusivitySet: () => void;
  removeExclusivitySet: (index: number) => void;
  newExclusivitySet: string;
  setNewExclusivitySet: (value: string) => void;
}

const LayersTabContainer = (props: LayersTabContainerProps) => {
  const {
    config,
    editingLayerIndex,
    setEditingLayerIndex,
    setSelectedLayerType,
    setShowLayerForm,
    setDefaultInterfaceGroup,
    updateLayer,
    addLayer,
    updateConfig,
    removeLayer,
    moveLayer
  } = props;

  const layersLogic = useLayersTabLogic({
    config,
    defaultInterfaceGroup: props.defaultInterfaceGroup,
    editingLayerIndex,
    setEditingLayerIndex,
    setSelectedLayerType,
    setShowLayerForm,
    setDefaultInterfaceGroup,
    updateLayer,
    addLayer,
    updateConfig
  });

  const contextValue = {
    config,
    editingLayerIndex,
    defaultInterfaceGroup: props.defaultInterfaceGroup,
    onRemoveLayer: removeLayer,
    onEditLayer: layersLogic.handleEditLayer,
    onEditBaseLayer: layersLogic.handleEditBaseLayer,
    onDuplicateLayer: layersLogic.handleDuplicateLayer,
    onMoveLayer: moveLayer,
    onUpdateLayer: updateLayer,
    onAddLayer: addLayer,
    onUpdateConfig: updateConfig,
    onAddDataSource: layersLogic.handleStartDataSourceFormWithExpansion,
    onRemoveDataSource: layersLogic.handleRemoveDataSource,
    onRemoveStatisticsSource: layersLogic.handleRemoveStatisticsSource,
    onEditDataSource: layersLogic.handleEditDataSource,
    onEditStatisticsSource: layersLogic.handleEditStatisticsSource
  };

  return (
    <LayersTabProvider value={contextValue}>
      <LayersTabCore
        {...props}
        layersLogic={layersLogic}
      />
    </LayersTabProvider>
  );
};

export default LayersTabContainer;
