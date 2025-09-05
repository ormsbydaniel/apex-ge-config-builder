
import React from 'react';
import { LayerType, DataSource } from '@/types/config';
import LayerTypeSelector from '../layer/LayerTypeSelector';
import BaseLayerForm from '../layer/BaseLayerForm';
import LayerCardForm from '../layer/LayerCardForm';

interface LayerFormContainerProps {
  showLayerForm: boolean;
  selectedLayerType: LayerType | null;
  interfaceGroups: string[];
  availableSources: DataSource[];
  availableExclusivitySets?: string[];
  defaultInterfaceGroup?: string;
  onSelectType: (type: LayerType) => void;
  onAddLayer: (layer: DataSource) => void;
  onCancel: () => void;
  editingLayer?: DataSource;
  isEditing?: boolean;
}

const LayerFormContainer = ({
  showLayerForm,
  selectedLayerType,
  interfaceGroups,
  availableSources,
  availableExclusivitySets = [],
  defaultInterfaceGroup,
  onSelectType,
  onAddLayer,
  onCancel,
  editingLayer,
  isEditing = false
}: LayerFormContainerProps) => {
  if (!showLayerForm) return null;

  if (!selectedLayerType) {
    return (
      <LayerTypeSelector 
        onSelectType={onSelectType}
        defaultInterfaceGroup={defaultInterfaceGroup}
      />
    );
  }

  if (selectedLayerType === 'base') {
    return (
      <BaseLayerForm
        onAddLayer={onAddLayer}
        onCancel={onCancel}
        editingLayer={editingLayer}
        isEditing={isEditing}
      />
    );
  }

  if (selectedLayerType === 'layerCard') {
    return (
      <LayerCardForm
        interfaceGroups={interfaceGroups}
        availableExclusivitySets={availableExclusivitySets}
        defaultInterfaceGroup={defaultInterfaceGroup}
        onAddLayer={onAddLayer}
        onCancel={onCancel}
        editingLayer={editingLayer}
        isEditing={isEditing}
      />
    );
  }

  return null;
};

export default LayerFormContainer;
