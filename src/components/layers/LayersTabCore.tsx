
import React from 'react';
import { DataSource, LayerType, Service } from '@/types/config';
import LayerFormHandler from './LayerFormHandler';
import LayersMainContent from './LayersMainContent';

interface LayersTabCoreProps {
  config: {
    sources: DataSource[];
    interfaceGroups: string[];
    services: Service[];
    exclusivitySets: string[];
  };
  showLayerForm: boolean;
  selectedLayerType: LayerType | null;
  defaultInterfaceGroup?: string;
  handleLayerTypeSelect: (type: LayerType) => void;
  handleCancelLayerForm: () => void;
  addLayer: (layer: DataSource) => void;
  addService: (service: Service) => void;
  updateLayer: (index: number, layer: DataSource) => void;
  editingLayerIndex: number | null;
  setEditingLayerIndex: (index: number | null) => void;
  setShowLayerForm: (show: boolean) => void;
  setSelectedLayerType: (type: LayerType | null) => void;
  setDefaultInterfaceGroup: (group: string | undefined) => void;
  addExclusivitySet: () => void;
  removeExclusivitySet: (index: number) => void;
  newExclusivitySet: string;
  setNewExclusivitySet: (value: string) => void;
  expandedLayers: Set<number>;
  onToggleLayer: (index: number) => void;
  layersLogic: any; // From useLayersTabLogic
}

const LayersTabCore = ({
  config,
  showLayerForm,
  selectedLayerType,
  defaultInterfaceGroup,
  handleLayerTypeSelect,
  handleCancelLayerForm,
  addLayer,
  addService,
  updateLayer,
  editingLayerIndex,
  setEditingLayerIndex,
  setShowLayerForm,
  setSelectedLayerType,
  setDefaultInterfaceGroup,
  addExclusivitySet,
  removeExclusivitySet,
  newExclusivitySet,
  setNewExclusivitySet,
  expandedLayers,
  onToggleLayer,
  layersLogic
}: LayersTabCoreProps) => {
  const handleLayerFormCancel = () => {
    // If we were editing a layer, trigger expansion for that layer
    if (editingLayerIndex !== null) {
      const editingLayer = config.sources[editingLayerIndex];
      if (editingLayer) {
        const groupName = editingLayer.layout?.interfaceGroup || 'ungrouped';
        layersLogic.handleLayerEdited?.(groupName, editingLayerIndex);
      }
    }
    
    handleCancelLayerForm();
    setEditingLayerIndex(null);
  };

  const handleLayerSaved = (layer: DataSource) => {
    if (editingLayerIndex !== null) {
      updateLayer(editingLayerIndex, layer);
      
      // Trigger expansion for the edited layer
      const groupName = layer.layout?.interfaceGroup || 'ungrouped';
      layersLogic.handleLayerEdited?.(groupName, editingLayerIndex);
      
      // Clear any stale data source form state when editing a layer
      if (layersLogic.clearDataSourceForm) {
        layersLogic.clearDataSourceForm();
      }
      
      setEditingLayerIndex(null);
    } else {
      // For new layers, trigger expansion after adding
      addLayer(layer);
      
      // Find the index where the new layer will be added
      const newLayerIndex = config.sources.length;
      const groupName = layer.layout?.interfaceGroup || 'ungrouped';
      layersLogic.handleLayerCreated?.(groupName, newLayerIndex);
    }
    
    setShowLayerForm(false);
    setSelectedLayerType(null);
    setDefaultInterfaceGroup(undefined);
  };

  // Show form if we're in form mode
  if (showLayerForm || (layersLogic && layersLogic.showDataSourceForm)) {
    return (
      <LayerFormHandler
        showLayerForm={showLayerForm}
        showDataSourceForm={layersLogic?.showDataSourceForm || false}
        selectedLayerType={selectedLayerType}
        selectedLayerIndex={layersLogic?.selectedLayerIndex ?? null}
        interfaceGroups={config.interfaceGroups}
        services={config.services}
        editingLayerIndex={editingLayerIndex}
        config={config}
        defaultInterfaceGroup={defaultInterfaceGroup}
        onSelectType={handleLayerTypeSelect}
        onLayerSaved={handleLayerSaved}
        onLayerFormCancel={handleLayerFormCancel}
        onDataSourceAdded={layersLogic?.handleDataSourceAdded || (() => {})}
        onStatisticsLayerAdded={layersLogic?.handleStatisticsLayerAdded || (() => {})}
        onDataSourceCancel={layersLogic?.handleCancelDataSource || (() => {})}
        onAddService={addService}
      />
    );
  }

  // Show main content
  return (
    <LayersMainContent
      addExclusivitySet={addExclusivitySet}
      removeExclusivitySet={removeExclusivitySet}
      newExclusivitySet={newExclusivitySet}
      setNewExclusivitySet={setNewExclusivitySet}
      expandedLayers={expandedLayers}
      onToggleLayer={onToggleLayer}
      layersLogic={layersLogic}
    />
  );
};

export default LayersTabCore;
