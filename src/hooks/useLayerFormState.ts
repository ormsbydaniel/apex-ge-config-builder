
import { useLayerExpansion } from './useLayerExpansion';
import { useDataSourceForm } from './useDataSourceForm';

export const useLayerFormState = () => {
  const expansionState = useLayerExpansion();
  const dataSourceForm = useDataSourceForm();

  const handleStartDataSourceForm = (layerIndex: number, layerCardId?: string) => {
    dataSourceForm.handleStartDataSourceForm(layerIndex);
    if (layerCardId) {
      expansionState.setExpandedAfterDataSource(layerCardId);
    }
  };

  const handleCancelDataSource = () => {
    dataSourceForm.handleCancelDataSource();
    // If we have a canceled layer index, trigger expansion for it
    if (dataSourceForm.canceledLayerIndex !== null) {
      // We need to pass both the group name and layer index, similar to handleLayerEdited
      const cardId = `layer-${dataSourceForm.canceledLayerIndex}`;
      expansionState.setExpandedAfterEdit(cardId);
    }
  };

  return {
    // Data source form state
    showDataSourceForm: dataSourceForm.showDataSourceForm,
    selectedLayerIndex: dataSourceForm.selectedLayerIndex,
    canceledLayerIndex: dataSourceForm.canceledLayerIndex,
    handleStartDataSourceForm,
    handleCancelDataSource,
    handleDataSourceComplete: dataSourceForm.handleDataSourceComplete,
    clearDataSourceForm: dataSourceForm.clearDataSourceForm,
    clearCanceledLayerIndex: dataSourceForm.clearCanceledLayerIndex,

    // Expansion state
    expandedLayerAfterDataSource: expansionState.expandedLayerAfterDataSource,
    expandedLayerAfterCreation: expansionState.expandedLayerAfterCreation,
    expandedLayerAfterEdit: expansionState.expandedLayerAfterEdit,
    expandedGroupAfterAction: expansionState.expandedGroupAfterAction,
    handleLayerCreated: expansionState.handleLayerCreated,
    handleLayerEdited: expansionState.handleLayerEdited,
    clearExpandedLayer: expansionState.clearExpandedLayer,
    clearExpandedLayerAfterCreation: expansionState.clearExpandedLayerAfterCreation,
    clearExpandedLayerAfterEdit: expansionState.clearExpandedLayerAfterEdit,
    clearExpandedGroup: expansionState.clearExpandedGroup
  };
};
