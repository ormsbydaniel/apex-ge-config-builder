
import React from 'react';
import { DataSource, LayerType, Service } from '@/types/config';
import { LayersTabProvider } from '@/contexts/LayersTabContext';
import { useLayersTabLogic } from '@/hooks/useLayersTabLogic';
import LayersTabCore from './LayersTabCore';

interface LayersTabContainerProps {
  config: {
    sources: DataSource[];
    interfaceGroups: string[];
    services: Service[];
    exclusivitySets: string[];
  };
  showLayerForm: boolean;
  selectedLayerType: LayerType | null;
  defaultInterfaceGroup?: string;
  setShowLayerForm: (show: boolean) => void;
  setSelectedLayerType: (type: LayerType | null) => void;
  setDefaultInterfaceGroup: (group: string | undefined) => void;
  handleLayerTypeSelect: (type: LayerType) => void;
  handleCancelLayerForm: () => void;
  addLayer: (layer: DataSource) => void;
  removeLayer: (index: number) => void;
  addService: (service: Service) => void;
  updateLayer: (index: number, layer: DataSource) => void;
  editingLayerIndex: number | null;
  setEditingLayerIndex: (index: number | null) => void;
  moveLayer: (fromIndex: number, toIndex: number) => void;
  updateConfig: (updates: { interfaceGroups?: string[]; sources?: DataSource[] }) => void;
  addExclusivitySet: () => void;
  removeExclusivitySet: (index: number) => void;
  newExclusivitySet: string;
  setNewExclusivitySet: (value: string) => void;
}

const LayersTabContainer = (props: LayersTabContainerProps) => {
  const {
    contextValue,
    expandedLayers,
    onToggleLayer
  } = useLayersTabLogic(props);

  // Add onUpdateLayer to the context value
  const enhancedContextValue = {
    ...contextValue,
    onUpdateLayer: props.updateLayer
  };

  return (
    <LayersTabProvider value={enhancedContextValue}>
      <LayersTabCore
        config={props.config}
        showLayerForm={props.showLayerForm}
        selectedLayerType={props.selectedLayerType}
        defaultInterfaceGroup={props.defaultInterfaceGroup}
        editingLayerIndex={props.editingLayerIndex}
        expandedLayers={expandedLayers}
        onToggleLayer={onToggleLayer}
        onLayerTypeSelect={props.handleLayerTypeSelect}
        onCancelLayerForm={props.handleCancelLayerForm}
        onAddLayer={props.addLayer}
        onAddService={props.addService}
        onAddExclusivitySet={props.addExclusivitySet}
        onRemoveExclusivitySet={props.removeExclusivitySet}
        newExclusivitySet={props.newExclusivitySet}
        onSetNewExclusivitySet={props.setNewExclusivitySet}
      />
    </LayersTabProvider>
  );
};

export default LayersTabContainer;
