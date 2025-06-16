
import React from 'react';
import { DataSource, LayerType, Service } from '@/types/config';
import LayerFormStateManager from './components/LayerFormStateManager';
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
  removeLayer: (index: number) => void;
  moveLayer: (fromIndex: number, toIndex: number) => void;
  updateConfig: (updates: { interfaceGroups?: string[]; sources?: DataSource[] }) => void;
  layersLogic: {
    showDataSourceForm: boolean;
    selectedLayerIndex: number | null;
    handleDataSourceAdded: (dataSource: any) => void;
    handleStatisticsLayerAdded: (statisticsItem: any) => void;
    handleCancelDataSource: () => void;
    expandedLayerAfterCreation: string | null;
    expandedGroupAfterAction: string | null;
    clearExpandedLayerAfterCreation: () => void;
    clearExpandedGroup: () => void;
    setShowAddGroupDialog: (show: boolean) => void;
    showAddGroupDialog: boolean;
    handleAddInterfaceGroup: (groupName: string) => boolean;
    handleAddLayerForGroup: (groupName: string) => void;
    handleAddBaseLayer: () => void;
    handleEditLayer: (index: number) => void;
    handleEditBaseLayer: (index: number) => void;
    handleDuplicateLayer: (index: number) => void;
    handleRemoveDataSource: (layerIndex: number, dataSourceIndex: number) => void;
    handleRemoveStatisticsSource: (layerIndex: number, statsIndex: number) => void;
    handleEditDataSource: (layerIndex: number, dataIndex: number) => void;
    handleEditStatisticsSource: (layerIndex: number, statsIndex: number) => void;
    handleStartDataSourceFormWithExpansion: (layerIndex: number) => void;
  };
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
  removeLayer,
  moveLayer,
  updateConfig,
  layersLogic
}: LayersTabCoreProps) => {
  const handleLayerFormCancel = () => {
    handleCancelLayerForm();
    setEditingLayerIndex(null);
  };

  const handleLayerSaved = (layer: DataSource) => {
    if (editingLayerIndex !== null) {
      updateLayer(editingLayerIndex, layer);
      setEditingLayerIndex(null);
    } else {
      addLayer(layer);
    }
    
    setShowLayerForm(false);
    setSelectedLayerType(null);
    setDefaultInterfaceGroup(undefined);
  };

  return (
    <>
      <LayerFormStateManager
        showLayerForm={showLayerForm}
        showDataSourceForm={layersLogic.showDataSourceForm}
        selectedLayerType={selectedLayerType}
        selectedLayerIndex={layersLogic.selectedLayerIndex}
        interfaceGroups={config.interfaceGroups}
        services={config.services}
        editingLayerIndex={editingLayerIndex}
        config={config}
        defaultInterfaceGroup={defaultInterfaceGroup}
        onSelectType={handleLayerTypeSelect}
        onLayerSaved={handleLayerSaved}
        onLayerFormCancel={handleLayerFormCancel}
        onDataSourceAdded={layersLogic.handleDataSourceAdded}
        onStatisticsLayerAdded={layersLogic.handleStatisticsLayerAdded}
        onDataSourceCancel={layersLogic.handleCancelDataSource}
        onAddService={addService}
      />

      {!showLayerForm && !layersLogic.showDataSourceForm && (
        <LayersMainContent
          addExclusivitySet={addExclusivitySet}
          removeExclusivitySet={removeExclusivitySet}
          newExclusivitySet={newExclusivitySet}
          setNewExclusivitySet={setNewExclusivitySet}
          layersLogic={layersLogic}
          removeLayer={removeLayer}
          moveLayer={moveLayer}
          updateConfig={updateConfig}
        />
      )}
    </>
  );
};

export default LayersTabCore;
