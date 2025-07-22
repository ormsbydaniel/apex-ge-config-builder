
import { useEffect, useState } from 'react';
import { DataSource, LayerType, Service } from '@/types/config';
import { useLayersTabComposition } from '@/hooks/useLayersTabComposition';
import { useLayerTypeHandlers } from './useLayerTypeHandlers';
import { useLayerCardState } from './useLayerCardState';
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
}

export const useLayersTabLogic = (props: UseLayersTabLogicProps) => {
  const { setDefaultInterfaceGroup, setSelectedLayerType, setShowLayerForm, setEditingLayerIndex } = props;
  const [showAddGroupDialog, setShowAddGroupDialog] = useState(false);

  // Use layer card state for expanded layers
  const { toggleCard, expandCard, expandedCards, isExpanded } = useLayerCardState();
  
  // Use scroll to layer functionality
  const { scrollToLayer } = useScrollToLayer();

  // Use the composed hook for all layers tab logic
  const composedLogic = useLayersTabComposition(props);

  // Use layer type handlers
  const layerTypeHandlers = useLayerTypeHandlers({
    setDefaultInterfaceGroup,
    setSelectedLayerType,
    setShowLayerForm,
    setEditingLayerIndex
  });

  const {
    showDataSourceForm,
    selectedLayerIndex,
    canceledLayerIndex,
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
    ...restLogic
  } = composedLogic;

  useEffect(() => {
    if (expandedLayerAfterDataSource && !showDataSourceForm) {
      expandCard(expandedLayerAfterDataSource);
      clearExpandedLayer();
    }
  }, [expandedLayerAfterDataSource, showDataSourceForm, expandCard, clearExpandedLayer]);

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
      clearCanceledLayerIndex();
    }
  }, [canceledLayerIndex, showDataSourceForm, expandCard, clearCanceledLayerIndex, scrollToLayer]);

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
    expandedLayerAfterCreation,
    expandedLayerAfterEdit,
    expandedGroupAfterAction,
    expandedLayers,
    onToggleLayer,
    handleStartDataSourceFormWithExpansion,
    clearExpandedLayerAfterCreation,
    clearExpandedLayerAfterEdit,
    clearExpandedGroup,
    // Layer type handlers
    ...layerTypeHandlers,
    // Spread all other logic from the composed hook
    ...restLogic
  };
};
