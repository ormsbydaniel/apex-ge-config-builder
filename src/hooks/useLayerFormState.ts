
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

  return {
    // Data source form state
    showDataSourceForm: dataSourceForm.showDataSourceForm,
    selectedLayerIndex: dataSourceForm.selectedLayerIndex,
    handleStartDataSourceForm,
    handleCancelDataSource: dataSourceForm.handleCancelDataSource,
    handleDataSourceComplete: dataSourceForm.handleDataSourceComplete,

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
