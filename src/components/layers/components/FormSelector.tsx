
import React from 'react';
import { DataSource, LayerType, Service } from '@/types/config';
import LayerFormContainer from '../LayerFormContainer';
import DataSourceForm from '../DataSourceForm';

interface FormSelectorProps {
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

const FormSelector = ({
  showLayerForm,
  showDataSourceForm,
  selectedLayerType,
  selectedLayerIndex,
  interfaceGroups,
  services,
  editingLayerIndex,
  config,
  defaultInterfaceGroup,
  onSelectType,
  onLayerSaved,
  onLayerFormCancel,
  onDataSourceAdded,
  onStatisticsLayerAdded,
  onDataSourceCancel,
  onAddService
}: FormSelectorProps) => {
  if (showLayerForm) {
    return (
      <LayerFormContainer
        showLayerForm={showLayerForm}
        selectedLayerType={selectedLayerType}
        interfaceGroups={interfaceGroups}
        availableSources={config.sources}
        defaultInterfaceGroup={defaultInterfaceGroup}
        onSelectType={onSelectType}
        onAddLayer={onLayerSaved}
        onCancel={onLayerFormCancel}
        editingLayer={editingLayerIndex !== null ? config.sources[editingLayerIndex] : undefined}
        isEditing={editingLayerIndex !== null}
      />
    );
  }

  if (showDataSourceForm && selectedLayerIndex !== null) {
    const currentLayer = config.sources[selectedLayerIndex];
    return (
      <DataSourceForm
        services={services}
        currentLayerStatistics={currentLayer?.statistics || []}
        onAddDataSource={onDataSourceAdded}
        onAddStatisticsLayer={onStatisticsLayerAdded}
        onAddService={onAddService}
        onCancel={onDataSourceCancel}
      />
    );
  }

  return null;
};

export default FormSelector;
