
import React from 'react';
import { DataSource, LayerType, Service } from '@/types/config';
import { NavigationState } from '@/hooks/useNavigationState';
import LayersTabContainer from './LayersTabContainer';

interface LayersTabProps {
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
  navigationState?: NavigationState;
  onExpansionStateChange?: (layers: string[], groups: string[]) => void;
}

const LayersTab = (props: LayersTabProps) => {
  return <LayersTabContainer {...props} />;
};

export default LayersTab;
