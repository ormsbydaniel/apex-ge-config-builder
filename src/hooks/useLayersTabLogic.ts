
import { useEffect, useState } from 'react';
import { DataSource, LayerType, Service } from '@/types/config';
import { useLayersTabComposition } from '@/hooks/useLayersTabComposition';
import { useLayerTypeHandlers } from './useLayerTypeHandlers';
import { useLayerCardState } from './useLayerCardState';

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
  const { toggleCard, expandedCards } = useLayerCardState();

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
    expandedLayerAfterDataSource,
    expandedLayerAfterCreation,
    expandedGroupAfterAction,
    clearExpandedLayer,
    clearExpandedLayerAfterCreation,
    clearExpandedGroup,
    handleStartDataSourceFormWithExpansion,
    ...restLogic
  } = composedLogic;

  useEffect(() => {
    if (expandedLayerAfterDataSource && !showDataSourceForm) {
      toggleCard(expandedLayerAfterDataSource);
      clearExpandedLayer();
    }
  }, [expandedLayerAfterDataSource, showDataSourceForm, toggleCard, clearExpandedLayer]);

  // Convert expanded cards to a Set for compatibility
  const expandedLayers = new Set(
    Array.from(expandedCards).map(cardId => {
      // Extract layer index from card ID
      const parts = cardId.split('-');
      const indexPart = parts[parts.length - 1];
      return parseInt(indexPart, 10);
    }).filter(index => !isNaN(index))
  );

  const onToggleLayer = (index: number) => {
    // Find existing card ID or create a new one
    const existingCardId = Array.from(expandedCards).find(cardId => cardId.endsWith(`-${index}`));
    if (existingCardId) {
      toggleCard(existingCardId);
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
    expandedGroupAfterAction,
    expandedLayers,
    onToggleLayer,
    handleStartDataSourceFormWithExpansion,
    clearExpandedLayerAfterCreation,
    clearExpandedGroup,
    // Layer type handlers
    ...layerTypeHandlers,
    // Spread all other logic from the composed hook
    ...restLogic
  };
};
