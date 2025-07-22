
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
    // When canceling data source, we only want to restore the layer card state
    // but NOT trigger Interface Group expansion changes
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
