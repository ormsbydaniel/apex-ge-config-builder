
import { useEffect, useState } from 'react';
import { DataSource, LayerType, Service } from '@/types/config';
import { NavigationState } from '@/hooks/useNavigationState';
import { useLayersTabComposition } from '@/hooks/useLayersTabComposition';
import { useLayerTypeHandlers } from './useLayerTypeHandlers';
// useLayerCardState functionality is now integrated into useLayersTabComposition
import { useScrollToLayer } from './useScrollToLayer';

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
  navigationState?: NavigationState;
}

export const useLayersTabLogic = (props: UseLayersTabLogicProps) => {
  const { setDefaultInterfaceGroup, setSelectedLayerType, setShowLayerForm, setEditingLayerIndex, navigationState } = props;
  const [showAddGroupDialog, setShowAddGroupDialog] = useState(false);

  // Use the composed hook for all layers tab logic
  const composedLogic = useLayersTabComposition(props);
  
  // Use scroll to layer functionality
  const { scrollToLayer } = useScrollToLayer();

  // Extract layer card state functions
  const { toggleCard, expandCard, expandedCards, isExpanded } = composedLogic;

  // Use layer type handlers
  const layerTypeHandlers = useLayerTypeHandlers({
    setDefaultInterfaceGroup,
    setSelectedLayerType,
    setShowLayerForm,
    setEditingLayerIndex,
    setExpandedGroupAfterAction: composedLogic.setExpandedGroupAfterAction,
    addLayer: props.addLayer
  });

  const {
    showDataSourceForm,
    selectedLayerIndex,
    canceledLayerIndex,
    isAddingStatistics,
    showConstraintForm,
    isAddingConstraint,
    expandedLayerAfterDataSource,
    expandedLayerAfterCreation,
    expandedLayerAfterEdit,
    expandedGroupAfterAction,
    clearExpandedLayer,
    clearExpandedLayerAfterCreation,
    clearExpandedLayerAfterEdit,
    clearExpandedGroup,
    clearCanceledLayerIndex,
    handleStartDataSourceFormWithExpansion,
    handleStartConstraintFormWithExpansion,
    editingConstraintIndex,
    editingConstraintLayerIndex,
    editingDataSourceIndex,
    editingDataSourceLayerIndex,
    ...restLogic
  } = composedLogic;

  // Restore expanded layers from navigationState on mount
  useEffect(() => {
    if (navigationState && navigationState.expandedLayers && navigationState.expandedLayers.length > 0) {
      // Expand all layers that were previously expanded
      navigationState.expandedLayers.forEach(layerId => {
        expandCard(layerId);
      });
    }
  }, []); // Only run on mount

  useEffect(() => {
    if (expandedLayerAfterDataSource && !showDataSourceForm && !showConstraintForm) {
      expandCard(expandedLayerAfterDataSource);
      
      // Extract layer index and scroll to it
      const cardIdStr = String(expandedLayerAfterDataSource);
      const parts = cardIdStr.split('-');
      const indexPart = parts[parts.length - 1];
      const layerIndex = parseInt(indexPart, 10);
      
      if (!isNaN(layerIndex)) {
        scrollToLayer(layerIndex, expandedLayerAfterDataSource);
        
        // Expand the appropriate group
        const layer = props.config.sources[layerIndex];
        if (layer) {
          if (layer.isBaseLayer) {
            composedLogic.setExpandedGroupAfterAction('__BASE_LAYERS__');
          } else if (layer.layout?.interfaceGroup) {
            composedLogic.setExpandedGroupAfterAction(layer.layout.interfaceGroup);
          } else {
            composedLogic.setExpandedGroupAfterAction('__UNGROUPED__');
          }
        }
      }
      
      clearExpandedLayer();
    }
  }, [expandedLayerAfterDataSource, showDataSourceForm, showConstraintForm, expandCard, clearExpandedLayer, scrollToLayer, props.config.sources, composedLogic.setExpandedGroupAfterAction]);

  // Handle expansion after layer creation
  useEffect(() => {
    if (expandedLayerAfterCreation) {
      expandCard(expandedLayerAfterCreation);
      // Extract layer index from card ID and scroll to it
      const cardIdStr = String(expandedLayerAfterCreation);
      const parts = cardIdStr.split('-');
      const indexPart = parts[parts.length - 1];
      const layerIndex = parseInt(indexPart, 10);
      if (!isNaN(layerIndex)) {
        scrollToLayer(layerIndex, expandedLayerAfterCreation);
      }
      clearExpandedLayerAfterCreation();
    }
  }, [expandedLayerAfterCreation, expandCard, clearExpandedLayerAfterCreation, scrollToLayer]);

  // Handle expansion after layer editing
  useEffect(() => {
    if (expandedLayerAfterEdit) {
      expandCard(expandedLayerAfterEdit);
      // Extract layer index from card ID and scroll to it
      const cardIdStr = String(expandedLayerAfterEdit);
      const parts = cardIdStr.split('-');
      const indexPart = parts[parts.length - 1];
      const layerIndex = parseInt(indexPart, 10);
      if (!isNaN(layerIndex)) {
        scrollToLayer(layerIndex, expandedLayerAfterEdit);
      }
      clearExpandedLayerAfterEdit();
    }
  }, [expandedLayerAfterEdit, expandCard, clearExpandedLayerAfterEdit, scrollToLayer]);

  // Handle expansion after data source cancellation
  useEffect(() => {
    if (canceledLayerIndex !== null && !showDataSourceForm) {
      const cardId = `layer-${canceledLayerIndex}`;
      expandCard(cardId);
      scrollToLayer(canceledLayerIndex, cardId);
      
      // Also expand the appropriate group
      const layer = props.config.sources[canceledLayerIndex];
      if (layer) {
        if (layer.isBaseLayer) {
          // For base layers, we need to handle this differently as it's not in a named interface group
          // Base layers are handled by LayerHierarchy's expandedBaseLayers state
          // We'll use a special group name to trigger base layer expansion
          composedLogic.setExpandedGroupAfterAction('__BASE_LAYERS__');
        } else if (layer.layout?.interfaceGroup) {
          composedLogic.setExpandedGroupAfterAction(layer.layout.interfaceGroup);
        } else {
          // For ungrouped layers
          composedLogic.setExpandedGroupAfterAction('__UNGROUPED__');
        }
      }
      
      clearCanceledLayerIndex();
    }
  }, [canceledLayerIndex, showDataSourceForm, expandCard, clearCanceledLayerIndex, scrollToLayer, props.config.sources, composedLogic.setExpandedGroupAfterAction]);

  // Convert expanded cards to a Set for compatibility
  const expandedLayers = new Set(
    Array.from(expandedCards || new Set()).map((cardId: string) => {
      // Extract layer index from card ID - ensure we're working with strings
      const cardIdStr = String(cardId);
      const parts = cardIdStr.split('-');
      const indexPart = parts[parts.length - 1];
      const parsedIndex = parseInt(indexPart, 10);
      return parsedIndex;
    }).filter(index => !isNaN(index))
  );

  const onToggleLayer = (index: number) => {
    // Find existing card ID or create a new one
    const existingCardId = Array.from(expandedCards || new Set()).find((cardId: string) => {
      const cardIdStr = String(cardId);
      return cardIdStr.endsWith(`-${index}`);
    });
    if (existingCardId) {
      toggleCard(String(existingCardId));
    } else {
      // Create a default card ID
      toggleCard(`layer-${index}`);
    }
  };

  return {
    showAddGroupDialog,
    setShowAddGroupDialog,
    showDataSourceForm,
    selectedLayerIndex,
    isAddingStatistics,
    showConstraintForm,
    isAddingConstraint,
    expandedLayerAfterCreation,
    expandedLayerAfterEdit,
    expandedGroupAfterAction,
    expandedLayers,
    onToggleLayer,
    handleStartDataSourceFormWithExpansion,
    handleStartConstraintFormWithExpansion,
    clearExpandedLayerAfterCreation,
    clearExpandedLayerAfterEdit,
    clearExpandedGroup,
    // Layer type handlers
    ...layerTypeHandlers,
    // Spread all other logic from the composed hook
    ...restLogic,
    // Explicitly expose editing state AFTER spreads to ensure they take precedence
    editingConstraintIndex,
    editingConstraintLayerIndex,
    editingDataSourceIndex,
    editingDataSourceLayerIndex,
  };
};
