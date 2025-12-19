
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
  onExpansionStateChange?: (layers: string[], groups: string[]) => void;
  navigationState?: { expandedGroups: string[]; expandedLayers: string[] };
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
  layersLogic,
  onExpansionStateChange,
  navigationState
}: LayersTabCoreProps) => {
  const handleLayerFormCancel = () => {
    // If we were editing a layer, trigger expansion for that layer
    if (editingLayerIndex !== null) {
      const editingLayer = config.sources[editingLayerIndex];
      if (editingLayer) {
        let groupName: string;
        if (editingLayer.isBaseLayer) {
          groupName = '__BASE_LAYERS__';
        } else if (editingLayer.layout?.interfaceGroup) {
          groupName = editingLayer.layout.interfaceGroup;
        } else {
          groupName = '__UNGROUPED__';
        }
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
      let groupName: string;
      if (layer.isBaseLayer) {
        groupName = '__BASE_LAYERS__';
      } else if (layer.layout?.interfaceGroup) {
        groupName = layer.layout.interfaceGroup;
      } else {
        groupName = '__UNGROUPED__';
      }
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
      
      // Determine the appropriate group name for expansion
      let groupName: string;
      if (layer.isBaseLayer) {
        groupName = '__BASE_LAYERS__';
      } else if (layer.layout?.interfaceGroup) {
        groupName = layer.layout.interfaceGroup;
      } else {
        groupName = '__UNGROUPED__';
      }
      
      layersLogic.handleLayerCreated?.(groupName, newLayerIndex);
    }
    
    setShowLayerForm(false);
    setSelectedLayerType(null);
    setDefaultInterfaceGroup(undefined);
  };

  // Show form if we're in form mode
  if (showLayerForm || (layersLogic && layersLogic.showDataSourceForm) || (layersLogic && layersLogic.showConstraintForm) || (layersLogic && layersLogic.showChartForm)) {
    return (
      <LayerFormHandler
        showLayerForm={showLayerForm}
        showDataSourceForm={layersLogic?.showDataSourceForm || false}
        showConstraintForm={layersLogic?.showConstraintForm || false}
        showChartForm={layersLogic?.showChartForm || false}
        selectedLayerType={selectedLayerType}
        selectedLayerIndex={layersLogic?.selectedLayerIndex ?? null}
        interfaceGroups={config.interfaceGroups}
        services={config.services}
        editingLayerIndex={editingLayerIndex}
        config={config}
        defaultInterfaceGroup={defaultInterfaceGroup}
        isAddingStatistics={layersLogic?.isAddingStatistics || false}
        isAddingConstraint={layersLogic?.isAddingConstraint || false}
        editingConstraintIndex={layersLogic?.editingConstraintIndex ?? null}
        editingConstraintLayerIndex={layersLogic?.editingConstraintLayerIndex ?? null}
        editingDataSourceIndex={layersLogic?.editingDataSourceIndex ?? null}
        editingDataSourceLayerIndex={layersLogic?.editingDataSourceLayerIndex ?? null}
        editingChartIndex={layersLogic?.editingChartIndex ?? null}
        editingChartLayerIndex={layersLogic?.editingChartLayerIndex ?? null}
        onSelectType={handleLayerTypeSelect}
        onLayerSaved={handleLayerSaved}
        onLayerFormCancel={handleLayerFormCancel}
        onDataSourceAdded={layersLogic?.handleDataSourceAdded || (() => {})}
        onStatisticsLayerAdded={layersLogic?.handleStatisticsLayerAdded || (() => {})}
        onConstraintSourceAdded={layersLogic?.handleConstraintSourceAdded || (() => {})}
        onUpdateConstraintSource={layersLogic?.handleUpdateConstraintSource || (() => {})}
        onUpdateDataSource={layersLogic?.handleUpdateDataSource || (() => {})}
        onChartAdded={layersLogic?.handleChartAdded || (() => {})}
        onUpdateChart={layersLogic?.handleUpdateChart || (() => {})}
        onDataSourceCancel={layersLogic?.handleCancelDataSource || (() => {})}
        onConstraintFormCancel={layersLogic?.handleCancelConstraint || (() => {})}
        onChartFormCancel={layersLogic?.handleCancelChart || (() => {})}
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
      onExpansionStateChange={onExpansionStateChange}
      navigationState={navigationState}
    />
  );
};

export default LayersTabCore;
