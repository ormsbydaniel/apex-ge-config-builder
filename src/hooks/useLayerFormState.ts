
import { useLayerExpansion } from './useLayerExpansion';
import { useDataSourceForm } from './useDataSourceForm';

export const useLayerFormState = () => {
  const expansionState = useLayerExpansion();
  const dataSourceForm = useDataSourceForm();

  const handleStartDataSourceForm = (layerIndex: number, layerCardId?: string) => {
    console.log('=== useLayerFormState.handleStartDataSourceForm ===');
    console.log('layerIndex:', layerIndex);
    console.log('layerCardId:', layerCardId);
    
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
    expandedGroupAfterAction: expansionState.expandedGroupAfterAction,
    handleLayerCreated: expansionState.handleLayerCreated,
    clearExpandedLayer: expansionState.clearExpandedLayer,
    clearExpandedLayerAfterCreation: expansionState.clearExpandedLayerAfterCreation,
    clearExpandedGroup: expansionState.clearExpandedGroup
  };
};
