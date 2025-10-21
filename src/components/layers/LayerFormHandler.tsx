
import React from 'react';
import { DataSource } from '@/types/config';
import { LayerTypeOption } from '@/hooks/useLayerOperations';
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
  config: { sources: DataSource[]; exclusivitySets?: string[] };
  defaultInterfaceGroup?: string;
  isAddingStatistics?: boolean;
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
  isAddingStatistics = false,
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
          availableExclusivitySets={config.exclusivitySets || []}
          defaultInterfaceGroup={defaultInterfaceGroup}
          services={services}
          onSelectType={onSelectType}
          onAddLayer={onLayerSaved}
          onAddService={onAddService}
          onCancel={onLayerFormCancel}
          editingLayer={editingLayerIndex !== null ? config.sources[editingLayerIndex] : undefined}
          isEditing={editingLayerIndex !== null}
        />
    );
  }

  
  
  if (showDataSourceForm && selectedLayerIndex !== null) {
    console.log('LayerFormHandler: showDataSourceForm=true, selectedLayerIndex=', selectedLayerIndex);
    console.log('LayerFormHandler: config.sources.length=', config.sources.length);
    const currentLayer = config.sources[selectedLayerIndex];
    
    if (!currentLayer) {
      console.error('No layer found at index:', selectedLayerIndex, 'Available sources:', config.sources.map(s => s.name));
      return null;
    }
    console.log('LayerFormHandler: Found current layer:', currentLayer.name);
    
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
        timeframe={currentLayer?.timeframe}
        onAddDataSource={onDataSourceAdded}
        onAddStatisticsLayer={onStatisticsLayerAdded}
        onAddService={onAddService}
        onCancel={onDataSourceCancel}
        allowedFormats={isAddingStatistics ? ['flatgeobuf', 'geojson'] : undefined}
        isAddingStatistics={isAddingStatistics}
      />
    );
  }

  return null;
};

export default LayerFormHandler;
