
import React, { useCallback } from 'react';
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
  const onAddDataSource = useCallback((layerIndex: number) => {
    layersLogic.handleStartDataSourceFormWithExpansion?.(layerIndex, false);
  }, [layersLogic]);

  const onAddStatisticsSource = useCallback((layerIndex: number) => {
    layersLogic.handleStartDataSourceFormWithExpansion?.(layerIndex, true);
  }, [layersLogic]);

  const onAddConstraintSource = useCallback((layerIndex: number) => {
    if (layersLogic?.handleStartConstraintFormWithExpansion) {
      layersLogic.handleStartConstraintFormWithExpansion(layerIndex);
    }
  }, [layersLogic]);

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
    onAddDataSource,
    onRemoveDataSource: layersLogic.handleRemoveDataSource,
    onRemoveStatisticsSource: layersLogic.handleRemoveStatisticsSource,
    onEditDataSource: layersLogic.handleEditDataSource,
    onEditStatisticsSource: layersLogic.handleEditStatisticsSource,
    onAddStatisticsSource,
    onAddConstraintSource,
    onRemoveConstraintSource: layersLogic.handleRemoveConstraintSource,
    onEditConstraintSource: layersLogic.handleEditConstraintSource,
    onMoveConstraintUp: layersLogic.handleMoveConstraintUp,
    onMoveConstraintDown: layersLogic.handleMoveConstraintDown,
    onMoveConstraintToTop: layersLogic.handleMoveConstraintToTop,
    onMoveConstraintToBottom: layersLogic.handleMoveConstraintToBottom,
    onAddWorkflow: layersLogic.handleAddWorkflow,
    onRemoveWorkflow: layersLogic.handleRemoveWorkflow,
    onUpdateWorkflow: layersLogic.handleUpdateWorkflow,
    onMoveWorkflowUp: layersLogic.handleMoveWorkflowUp,
    onMoveWorkflowDown: layersLogic.handleMoveWorkflowDown,
    onMoveWorkflowToTop: layersLogic.handleMoveWorkflowToTop,
    onMoveWorkflowToBottom: layersLogic.handleMoveWorkflowToBottom,
    // Chart actions
    onAddChart: layersLogic.addChart,
    onRemoveChart: layersLogic.removeChart,
    onUpdateChart: layersLogic.updateChart,
    onStartChartForm: layersLogic.handleStartChartFormWithExpansion,
    onEditChartSource: layersLogic.handleEditChartSource,
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
