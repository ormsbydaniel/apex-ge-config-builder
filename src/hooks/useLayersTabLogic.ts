
import { useEffect, useState } from 'react';
import { DataSource, LayerType, Service } from '@/types/config';
import { useLayerTypeHandlers } from './useLayerTypeHandlers';
import { useLayerFormState } from './useLayerFormState';
import { useLayerCardState } from './useLayerCardState';
import { useLayerActions } from './useLayerActions';
import { useDataSourceActions } from './useDataSourceActions';
import { useInterfaceGroupActions } from './useInterfaceGroupActions';

interface UseLayersTabLogicProps {
  config: {
    sources: DataSource[];
    interfaceGroups: string[];
    services: Service[];
    exclusivitySets: string[];
  };
  defaultInterfaceGroup?: string;
  editingLayerIndex: number | null;
  setEditingLayerIndex: (index: number | null) => void;
  setSelectedLayerType: (type: LayerType | null) => void;
  setShowLayerForm: (show: boolean) => void;
  setDefaultInterfaceGroup: (group: string | undefined) => void;
  updateLayer: (index: number, layer: DataSource) => void;
  addLayer: (layer: DataSource) => void;
  updateConfig: (updates: { interfaceGroups?: string[]; sources?: DataSource[] }) => void;
}

export const useLayersTabLogic = (props: UseLayersTabLogicProps) => {
  const { 
    config,
    setDefaultInterfaceGroup, 
    setSelectedLayerType, 
    setShowLayerForm, 
    setEditingLayerIndex,
    updateLayer,
    addLayer,
    updateConfig
  } = props;
  
  const [showAddGroupDialog, setShowAddGroupDialog] = useState(false);

  // Individual hook results
  const layerFormState = useLayerFormState();
  const layerCardState = useLayerCardState();
  const layerActions = useLayerActions({
    config,
    updateLayer,
    addLayer,
    setEditingLayerIndex,
    setSelectedLayerType,
    setShowLayerForm
  });
  const dataSourceActions = useDataSourceActions({
    config,
    updateLayer,
    selectedLayerIndex: layerFormState.selectedLayerIndex,
    handleLayerCreated: layerFormState.handleLayerCreated,
    handleDataSourceComplete: layerFormState.handleDataSourceComplete
  });
  const interfaceGroupActions = useInterfaceGroupActions({
    config,
    updateConfig
  });

  // Layer type handlers
  const layerTypeHandlers = useLayerTypeHandlers({
    setDefaultInterfaceGroup,
    setSelectedLayerType,
    setShowLayerForm,
    setEditingLayerIndex
  });

  const {
    showDataSourceForm,
    selectedLayerIndex,
    expandedLayerAfterDataSource,
    expandedLayerAfterCreation,
    expandedGroupAfterAction,
    clearExpandedLayer,
    clearExpandedLayerAfterCreation,
    clearExpandedGroup,
    handleStartDataSourceForm
  } = layerFormState;

  useEffect(() => {
    if (expandedLayerAfterDataSource && !showDataSourceForm) {
      layerCardState.toggleCard(expandedLayerAfterDataSource);
      clearExpandedLayer();
    }
  }, [expandedLayerAfterDataSource, showDataSourceForm, layerCardState.toggleCard, clearExpandedLayer]);

  const handleStartDataSourceFormWithExpansion = (layerIndex: number) => {
    const layer = config.sources[layerIndex];
    const groupName = layer.layout?.interfaceGroup || 'ungrouped';
    const cardId = `${groupName}-${layerIndex}`;
    
    handleStartDataSourceForm(layerIndex, cardId);
  };

  return {
    showAddGroupDialog,
    setShowAddGroupDialog,
    showDataSourceForm,
    selectedLayerIndex,
    expandedLayerAfterCreation,
    expandedGroupAfterAction,
    handleStartDataSourceFormWithExpansion,
    clearExpandedLayerAfterCreation: clearExpandedLayerAfterCreation,
    clearExpandedGroup,
    toggleCard: layerCardState.toggleCard,
    
    // Layer type handlers
    ...layerTypeHandlers,
    
    // Layer actions
    handleEditLayer: layerActions.handleEditLayer,
    handleEditBaseLayer: layerActions.handleEditBaseLayer,
    handleDuplicateLayer: layerActions.handleDuplicateLayer,
    handleRemoveDataSource: layerActions.handleRemoveDataSource,
    handleRemoveStatisticsSource: layerActions.handleRemoveStatisticsSource,
    handleEditDataSource: layerActions.handleEditDataSource,
    handleEditStatisticsSource: layerActions.handleEditStatisticsSource,
    
    // Data source actions
    handleDataSourceAdded: dataSourceActions.handleDataSourceAdded,
    handleStatisticsLayerAdded: dataSourceActions.handleStatisticsLayerAdded,
    handleCancelDataSource: layerFormState.handleCancelDataSource,
    
    // Interface group actions
    handleAddInterfaceGroup: interfaceGroupActions.handleAddInterfaceGroup
  };
};
