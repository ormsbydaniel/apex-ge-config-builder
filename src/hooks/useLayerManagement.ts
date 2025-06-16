
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { DataSource, LayerType } from '@/types/config';

interface UseLayerManagementProps {
  config: { sources: DataSource[] };
  dispatch: (action: any) => void;
}

export const useLayerManagement = ({ config, dispatch }: UseLayerManagementProps) => {
  const { toast } = useToast();
  const [showLayerForm, setShowLayerForm] = useState(false);
  const [selectedLayerType, setSelectedLayerType] = useState<LayerType | null>(null);
  const [editingLayerIndex, setEditingLayerIndex] = useState<number | null>(null);
  const [defaultInterfaceGroup, setDefaultInterfaceGroup] = useState<string | undefined>(undefined);

  const addLayer = useCallback((layer: DataSource) => {
    dispatch({ type: 'ADD_SOURCE', payload: layer });
    setShowLayerForm(false);
    setSelectedLayerType(null);
    setDefaultInterfaceGroup(undefined);
  }, [dispatch]);

  const removeLayer = useCallback((index: number) => {
    dispatch({ type: 'REMOVE_SOURCE', payload: index });
  }, [dispatch]);

  const updateLayer = useCallback((index: number, layer: DataSource) => {
    const updatedSources = [...config.sources];
    updatedSources[index] = layer;
    dispatch({ type: 'UPDATE_SOURCES', payload: updatedSources });
  }, [config.sources, dispatch]);

  const moveLayer = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    const newSources = [...config.sources];
    const [movedLayer] = newSources.splice(fromIndex, 1);
    newSources.splice(toIndex, 0, movedLayer);
    
    dispatch({ type: 'UPDATE_SOURCES', payload: newSources });
    
    toast({
      title: "Layer Moved",
      description: "Layer order has been updated.",
    });
  }, [config.sources, dispatch, toast]);

  const handleLayerTypeSelect = useCallback((type: LayerType) => {
    setSelectedLayerType(type);
  }, []);

  const handleCancelLayerForm = useCallback(() => {
    setShowLayerForm(false);
    setSelectedLayerType(null);
    setEditingLayerIndex(null);
    setDefaultInterfaceGroup(undefined);
  }, []);

  const updateConfig = useCallback((updates: { interfaceGroups?: string[]; sources?: DataSource[]; services?: any[] }) => {
    if (updates.interfaceGroups) {
      dispatch({ type: 'UPDATE_INTERFACE_GROUPS', payload: updates.interfaceGroups });
    }
    if (updates.sources) {
      dispatch({ type: 'UPDATE_SOURCES', payload: updates.sources });
    }
  }, [dispatch]);

  return {
    showLayerForm,
    setShowLayerForm,
    selectedLayerType,
    setSelectedLayerType,
    editingLayerIndex,
    setEditingLayerIndex,
    defaultInterfaceGroup,
    setDefaultInterfaceGroup,
    addLayer,
    removeLayer,
    updateLayer,
    moveLayer,
    handleLayerTypeSelect,
    handleCancelLayerForm,
    updateConfig
  };
};
