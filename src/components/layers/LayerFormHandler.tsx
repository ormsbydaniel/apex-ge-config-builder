
import React from 'react';
import { DataSource, ConstraintSourceItem } from '@/types/config';
import { LayerTypeOption } from '@/hooks/useLayerOperations';
import LayerFormContainer from './LayerFormContainer';
import DataSourceForm from './DataSourceForm';
import ConstraintSourceForm from './components/ConstraintSourceForm';

interface LayerFormHandlerProps {
  showLayerForm: boolean;
  showDataSourceForm: boolean;
  showConstraintForm?: boolean;
  selectedLayerType: any;
  selectedLayerIndex: number | null;
  interfaceGroups: string[];
  services: any[];
  editingLayerIndex: number | null;
  config: { sources: DataSource[]; exclusivitySets?: string[] };
  defaultInterfaceGroup?: string;
  isAddingStatistics?: boolean;
  isAddingConstraint?: boolean;
  editingConstraintIndex?: number | null;
  editingConstraintLayerIndex?: number | null;
  onSelectType: (type: any) => void;
  onLayerSaved: (layer: DataSource) => void;
  onLayerFormCancel: () => void;
  onDataSourceAdded: (dataSource: any) => void;
  onStatisticsLayerAdded: (statisticsItem: any) => void;
  onConstraintSourceAdded?: (constraint: ConstraintSourceItem | ConstraintSourceItem[]) => void;
  onUpdateConstraintSource?: (constraint: ConstraintSourceItem, layerIndex: number, constraintIndex: number) => void;
  onDataSourceCancel: () => void;
  onConstraintFormCancel?: () => void;
  onAddService: (service: any) => void;
}

const LayerFormHandler = ({
  showLayerForm,
  showDataSourceForm,
  showConstraintForm = false,
  selectedLayerType,
  selectedLayerIndex,
  interfaceGroups,
  services,
  editingLayerIndex,
  config,
  defaultInterfaceGroup,
  isAddingStatistics = false,
  isAddingConstraint = false,
  editingConstraintIndex = null,
  editingConstraintLayerIndex = null,
  onSelectType,
  onLayerSaved,
  onLayerFormCancel,
  onDataSourceAdded,
  onStatisticsLayerAdded,
  onConstraintSourceAdded,
  onUpdateConstraintSource,
  onDataSourceCancel,
  onConstraintFormCancel,
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

  if (showConstraintForm && selectedLayerIndex !== null) {
    console.log('LayerFormHandler: showConstraintForm=true, selectedLayerIndex=', selectedLayerIndex);
    const currentLayer = config.sources[selectedLayerIndex];
    
    if (!currentLayer) {
      console.error('No layer found at index:', selectedLayerIndex);
      return null;
    }
    
    // Get the constraint being edited if in edit mode
    const editingConstraint = editingConstraintIndex !== null && editingConstraintLayerIndex !== null
      ? config.sources[editingConstraintLayerIndex]?.constraints?.[editingConstraintIndex]
      : undefined;
    
    // Create handler that routes to add or update based on editing state
    const handleConstraintSubmit = (constraint: ConstraintSourceItem) => {
      if (editingConstraintIndex !== null && editingConstraintLayerIndex !== null && onUpdateConstraintSource) {
        onUpdateConstraintSource(constraint, editingConstraintLayerIndex, editingConstraintIndex);
      } else if (onConstraintSourceAdded) {
        onConstraintSourceAdded(constraint);
      }
    };
    
    return (
      <ConstraintSourceForm
        services={services}
        onAddConstraintSource={handleConstraintSubmit}
        onAddService={onAddService}
        onCancel={onConstraintFormCancel || (() => {})}
        editingConstraint={editingConstraint}
        editingIndex={editingConstraintIndex || undefined}
      />
    );
  }

  return null;
};

export default LayerFormHandler;
