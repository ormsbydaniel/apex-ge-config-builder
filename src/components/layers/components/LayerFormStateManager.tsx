
import React from 'react';
import { DataSource, LayerType, Service } from '@/types/config';
import LayerFormHandler from '../LayerFormHandler';

interface LayerFormStateManagerProps {
  showLayerForm: boolean;
  showDataSourceForm: boolean;
  selectedLayerType: LayerType | null;
  selectedLayerIndex: number | null;
  interfaceGroups: string[];
  services: Service[];
  editingLayerIndex: number | null;
  config: { sources: DataSource[] };
  defaultInterfaceGroup?: string;
  onSelectType: (type: LayerType) => void;
  onLayerSaved: (layer: DataSource) => void;
  onLayerFormCancel: () => void;
  onDataSourceAdded: (dataSource: any) => void;
  onStatisticsLayerAdded: (statisticsItem: any) => void;
  onDataSourceCancel: () => void;
  onAddService: (service: Service) => void;
}

const LayerFormStateManager = (props: LayerFormStateManagerProps) => {
  // Only render if we're in a form state
  if (!props.showLayerForm && !props.showDataSourceForm) {
    return null;
  }

  return <LayerFormHandler {...props} />;
};

export default LayerFormStateManager;
