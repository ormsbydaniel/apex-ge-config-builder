
import React from 'react';
import { DataSource, LayerType, Service } from '@/types/config';
import FormSelector from './components/FormSelector';

interface LayerFormHandlerProps {
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

const LayerFormHandler = (props: LayerFormHandlerProps) => {
  return <FormSelector {...props} />;
};

export default LayerFormHandler;
