
import React from 'react';
import { DataSource, LayerType, Service } from '@/types/config';
import { NavigationState } from '@/hooks/useNavigationState';
import { LayersTabProvider } from '@/contexts/LayersTabContext';
import { useLayersTabLogic } from '@/hooks/useLayersTabLogic';
import LayersTabCore from './LayersTabCore';

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
  navigationState?: NavigationState;
  onExpansionStateChange?: (layers: string[], groups: string[]) => void;
}

const LayersTabContainer = (props: LayersTabContainerProps) => {
  const layersLogic = useLayersTabLogic({ ...props, navigationState: props.navigationState });

  // Create context value with all required properties
  const contextValue = {
    config: props.config,
    editingLayerIndex: props.editingLayerIndex,
    defaultInterfaceGroup: props.defaultInterfaceGroup,
    onRemoveLayer: props.removeLayer,
    onEditLayer: layersLogic.handleEditLayer,
    onEditBaseLayer: layersLogic.handleEditBaseLayer,
    onDuplicateLayer: layersLogic.handleDuplicateLayer,
    onMoveLayer: props.moveLayer,
    moveLayerToTop: layersLogic.moveLayerToTop,
    moveLayerToBottom: layersLogic.moveLayerToBottom,
    onUpdateLayer: props.updateLayer,
    onAddLayer: props.addLayer,
    onUpdateConfig: props.updateConfig,
    onAddDataSource: layersLogic.handleStartDataSourceFormWithExpansion,
    onRemoveDataSource: layersLogic.handleRemoveDataSource,
    onRemoveStatisticsSource: layersLogic.handleRemoveStatisticsSource,
    onEditDataSource: layersLogic.handleEditDataSource,
    onEditStatisticsSource: layersLogic.handleEditStatisticsSource
  };

  return (
    <LayersTabProvider value={contextValue}>
      <LayersTabCore
        config={props.config}
        showLayerForm={props.showLayerForm}
        selectedLayerType={props.selectedLayerType}
        defaultInterfaceGroup={props.defaultInterfaceGroup}
        editingLayerIndex={props.editingLayerIndex}
        expandedLayers={layersLogic.expandedLayers}
        onToggleLayer={layersLogic.onToggleLayer}
        handleLayerTypeSelect={props.handleLayerTypeSelect}
        handleCancelLayerForm={props.handleCancelLayerForm}
        addLayer={props.addLayer}
        addService={props.addService}
        updateLayer={props.updateLayer}
        setEditingLayerIndex={props.setEditingLayerIndex}
        setShowLayerForm={props.setShowLayerForm}
        setSelectedLayerType={props.setSelectedLayerType}
        setDefaultInterfaceGroup={props.setDefaultInterfaceGroup}
        addExclusivitySet={props.addExclusivitySet}
        removeExclusivitySet={props.removeExclusivitySet}
        newExclusivitySet={props.newExclusivitySet}
        setNewExclusivitySet={props.setNewExclusivitySet}
        layersLogic={layersLogic}
        onExpansionStateChange={props.onExpansionStateChange}
        navigationState={props.navigationState}
      />
    </LayersTabProvider>
  );
};

export default LayersTabContainer;
