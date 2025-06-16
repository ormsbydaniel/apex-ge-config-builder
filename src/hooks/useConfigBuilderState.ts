
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useValidatedConfig } from '@/hooks/useValidatedConfig';
import { DataSource, Service, LayerType } from '@/types/config';

export const useConfigBuilderState = () => {
  const { toast } = useToast();
  const { config, dispatch } = useValidatedConfig();
  const [newExclusivitySet, setNewExclusivitySet] = useState('');
  const [showLayerForm, setShowLayerForm] = useState(false);
  const [selectedLayerType, setSelectedLayerType] = useState<LayerType | null>(null);
  const [editingLayerIndex, setEditingLayerIndex] = useState<number | null>(null);
  const [defaultInterfaceGroup, setDefaultInterfaceGroup] = useState<string | undefined>(undefined);

  const updateLayout = (field: string, value: string) => {
    dispatch({ type: 'UPDATE_LAYOUT', payload: { field, value } });
  };

  const updateInterfaceGroups = (interfaceGroups: string[]) => {
    dispatch({ type: 'UPDATE_INTERFACE_GROUPS', payload: interfaceGroups });
  };

  const addExclusivitySet = () => {
    if (newExclusivitySet.trim()) {
      dispatch({ 
        type: 'UPDATE_EXCLUSIVITY_SETS', 
        payload: [...config.exclusivitySets, newExclusivitySet.trim()] 
      });
      setNewExclusivitySet('');
      toast({
        title: "Exclusivity Set Added",
        description: `"${newExclusivitySet}" has been added to exclusivity sets.`,
      });
    }
  };

  const removeExclusivitySet = (index: number) => {
    dispatch({ 
      type: 'UPDATE_EXCLUSIVITY_SETS', 
      payload: config.exclusivitySets.filter((_, i) => i !== index) 
    });
  };

  const addService = (service: Service) => {
    dispatch({ type: 'ADD_SERVICE', payload: service });
  };

  const removeService = (index: number) => {
    const serviceToRemove = config.services[index];
    dispatch({ type: 'REMOVE_SERVICE', payload: index });

    toast({
      title: "Service Removed",
      description: `"${serviceToRemove.name}" has been removed. Associated sources have been updated.`,
    });
  };

  const addLayer = (layer: DataSource) => {
    dispatch({ type: 'ADD_SOURCE', payload: layer });
    setShowLayerForm(false);
    setSelectedLayerType(null);
    setDefaultInterfaceGroup(undefined);
  };

  const removeLayer = (index: number) => {
    dispatch({ type: 'REMOVE_SOURCE', payload: index });
  };

  const handleLayerTypeSelect = (type: LayerType) => {
    setSelectedLayerType(type);
  };

  const handleCancelLayerForm = () => {
    setShowLayerForm(false);
    setSelectedLayerType(null);
    setEditingLayerIndex(null);
    setDefaultInterfaceGroup(undefined);
  };

  const updateLayer = (index: number, layer: DataSource) => {
    const updatedSources = [...config.sources];
    updatedSources[index] = layer;
    dispatch({ type: 'UPDATE_SOURCES', payload: updatedSources });
  };

  const moveLayer = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    const newSources = [...config.sources];
    const [movedLayer] = newSources.splice(fromIndex, 1);
    newSources.splice(toIndex, 0, movedLayer);
    
    dispatch({ type: 'UPDATE_SOURCES', payload: newSources });
    
    toast({
      title: "Layer Moved",
      description: "Layer order has been updated.",
    });
  };

  const updateConfig = (updates: { interfaceGroups?: string[]; sources?: DataSource[]; services?: Service[] }) => {
    if (updates.interfaceGroups) {
      updateInterfaceGroups(updates.interfaceGroups);
    }
    if (updates.sources) {
      dispatch({ type: 'UPDATE_SOURCES', payload: updates.sources });
    }
  };

  return {
    config,
    newExclusivitySet,
    setNewExclusivitySet,
    showLayerForm,
    setShowLayerForm,
    selectedLayerType,
    setSelectedLayerType,
    editingLayerIndex,
    setEditingLayerIndex,
    defaultInterfaceGroup,
    setDefaultInterfaceGroup,
    updateLayout,
    updateInterfaceGroups,
    addExclusivitySet,
    removeExclusivitySet,
    addService,
    removeService,
    addLayer,
    removeLayer,
    updateLayer,
    moveLayer,
    handleLayerTypeSelect,
    handleCancelLayerForm,
    updateConfig
  };
};
