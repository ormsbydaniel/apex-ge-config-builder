
import { useEffect, useState } from 'react';
import { DataSource, LayerType, Service } from '@/types/config';
import { useLayersTabComposition } from '@/hooks/useLayersTabComposition';
import { useLayerTypeHandlers } from './useLayerTypeHandlers';

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
    toggleCard,
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

  return {
    showAddGroupDialog,
    setShowAddGroupDialog,
    showDataSourceForm,
    selectedLayerIndex,
    expandedLayerAfterCreation,
    expandedGroupAfterAction,
    handleStartDataSourceFormWithExpansion,
    clearExpandedLayerAfterCreation,
    clearExpandedGroup,
    // Layer type handlers
    ...layerTypeHandlers,
    // Spread all other logic from the composed hook
    ...restLogic
  };
};
