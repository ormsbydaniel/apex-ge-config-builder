
import React from 'react';
import { DataSource } from '@/types/config';
import { LayerTypeOption } from '@/hooks/useLayerTypeManagement';
import LayerFormContainer from './LayerFormContainer';
import DataSourceForm from './DataSourceForm';

interface LayerFormHandlerProps {
  showLayerForm: boolean;
  showDataSourceForm: boolean;
  selectedLayerType: any;
  selectedLayerIndex: number | null;
  interfaceGroups: string[];
  services: any[];
  editingLayerIndex: number | null;
  config: { sources: DataSource[] };
  defaultInterfaceGroup?: string;
  onSelectType: (type: any) => void;
  onLayerSaved: (layer: DataSource) => void;
  onLayerFormCancel: () => void;
  onDataSourceAdded: (dataSource: any) => void;
  onStatisticsLayerAdded: (statisticsItem: any) => void;
  onDataSourceCancel: () => void;
  onAddService: (service: any) => void;
}

const LayerFormHandler = ({
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
}: LayerFormHandlerProps) => {
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
    
    // Determine layer type from flags
    let layerType: LayerTypeOption = 'standard';
    if ((currentLayer as any).isSwipeLayer) layerType = 'swipe';
    else if ((currentLayer as any).isMirrorLayer) layerType = 'mirror';
    else if ((currentLayer as any).isSpotlightLayer) layerType = 'spotlight';
    
    return (
      <DataSourceForm
        services={services}
        currentLayerStatistics={currentLayer?.statistics || []}
        layerType={layerType}
        onAddDataSource={onDataSourceAdded}
        onAddStatisticsLayer={onStatisticsLayerAdded}
        onAddService={onAddService}
        onCancel={onDataSourceCancel}
      />
    );
  }

  return null;
};

export default LayerFormHandler;
