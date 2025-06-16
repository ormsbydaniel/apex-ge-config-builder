
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

  // Show form if we're in form mode
  if (showLayerForm || layersLogic.showDataSourceForm) {
    return (
      <LayerFormHandler
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
    );
  }

  // Show main content
  return (
    <LayersMainContent
      addExclusivitySet={addExclusivitySet}
      removeExclusivitySet={removeExclusivitySet}
      newExclusivitySet={newExclusivitySet}
      setNewExclusivitySet={setNewExclusivitySet}
      layersLogic={layersLogic}
    />
  );
};

export default LayersTabCore;
