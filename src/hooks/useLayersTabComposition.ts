
import { useCallback } from 'react';
import { DataSource, LayerType, Service } from '@/types/config';
import { useLayerStateManagement } from '@/hooks/useLayerStateManagement';
import { useLayerOperations } from '@/hooks/useLayerOperations';
import { useInterfaceGroupActions } from '@/hooks/useInterfaceGroupActions';
import { useCompositeHook } from '@/hooks/useCompositeHook';

interface LayersTabCompositionProps {
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

/**
 * Composed hook that combines all layers tab logic using hook composition utilities
 */
export const useLayersTabComposition = (props: LayersTabCompositionProps) => {
  const {
    config,
    editingLayerIndex,
    setEditingLayerIndex,
    setSelectedLayerType,
    setShowLayerForm,
    updateLayer,
    addLayer,
    updateConfig
  } = props;

  // Get consolidated layer state management
  const layerState = useLayerStateManagement();
  
  // Get consolidated layer operations (replaces useLayerActions, useDataSourceActions, useLayerManagement)
  const layerOperations = useLayerOperations({
    config,
    dispatch: (action: any) => {
      // Handle different dispatch action types
      if (action.type === 'ADD_SOURCE') {
        addLayer(action.payload);
      } else if (action.type === 'UPDATE_SOURCES') {
        updateConfig({ sources: action.payload });
      } else if (action.type === 'REMOVE_SOURCE') {
        const updatedSources = [...config.sources];
        updatedSources.splice(action.payload, 1);
        updateConfig({ sources: updatedSources });
      } else if (action.type === 'UPDATE_INTERFACE_GROUPS') {
        updateConfig({ interfaceGroups: action.payload });
      }
    },
    selectedLayerIndex: layerState.selectedLayerIndex,
    handleLayerCreated: layerState.handleLayerCreated,
    handleDataSourceComplete: layerState.handleDataSourceComplete,
    // Pass through the actual state setters from props instead of using internal state
    setShowLayerForm: setShowLayerForm,
    setSelectedLayerType: setSelectedLayerType,
    setEditingLayerIndex: setEditingLayerIndex,
    setDefaultInterfaceGroup: props.setDefaultInterfaceGroup
  });
  
  const interfaceGroupActions = useInterfaceGroupActions({
    config,
    updateConfig
  });

  const result = {
    // Layer state management (consolidated)
    ...layerState,
    
    // Layer operations (consolidated)
    ...layerOperations,
    
    // Interface group actions
    handleAddInterfaceGroup: interfaceGroupActions.handleAddInterfaceGroup,
    
    // Custom composed methods
    handleStartDataSourceFormWithExpansion: (layerIndex: number, isAddingStatistics = false) => {
      
      const layer = config.sources[layerIndex];
      console.log('Layer found:', layer ? layer.name : 'UNDEFINED');
      const groupName = layer?.layout?.interfaceGroup || 'ungrouped';
      const cardId = `${groupName}-${layerIndex}`;
      
      layerState.handleStartDataSourceForm(layerIndex, cardId, isAddingStatistics);
    }
  };
  
  return result;
};
