
import React, { useMemo } from 'react';
import { DataSource, ConstraintSourceItem, Service } from '@/types/config';
import { LayerTypeOption } from '@/hooks/useLayerOperations';
import { ChartConfig } from '@/types/chart';
import LayerFormContainer from './LayerFormContainer';
import DataSourceForm from './DataSourceForm';
import ConstraintSourceForm from './components/ConstraintSourceForm';
import { ChartSourceForm } from './components/ChartSourceForm';

interface LayerFormHandlerProps {
  showLayerForm: boolean;
  showDataSourceForm: boolean;
  showConstraintForm?: boolean;
  showChartForm?: boolean;
  selectedLayerType: any;
  selectedLayerIndex: number | null;
  interfaceGroups: string[];
  services: Service[];
  editingLayerIndex: number | null;
  config: { sources: DataSource[]; exclusivitySets?: string[] };
  defaultInterfaceGroup?: string;
  isAddingStatistics?: boolean;
  isAddingConstraint?: boolean;
  editingConstraintIndex?: number | null;
  editingConstraintLayerIndex?: number | null;
  editingDataSourceIndex?: number | null;
  editingDataSourceLayerIndex?: number | null;
  editingChartIndex?: number | null;
  editingChartLayerIndex?: number | null;
  onSelectType: (type: any) => void;
  onLayerSaved: (layer: DataSource) => void;
  onLayerFormCancel: () => void;
  onDataSourceAdded: (dataSource: any) => void;
  onStatisticsLayerAdded: (statisticsItem: any) => void;
  onConstraintSourceAdded?: (constraint: ConstraintSourceItem | ConstraintSourceItem[]) => void;
  onUpdateConstraintSource?: (constraint: ConstraintSourceItem, layerIndex: number, constraintIndex: number) => void;
  onUpdateDataSource?: (dataSource: any, layerIndex: number, dataSourceIndex: number) => void;
  onChartAdded?: (chart: ChartConfig) => void;
  onUpdateChart?: (chart: ChartConfig, layerIndex: number, chartIndex: number) => void;
  onDataSourceCancel: () => void;
  onConstraintFormCancel?: () => void;
  onChartFormCancel?: () => void;
  onAddService: (service: any) => void;
}

const LayerFormHandler = ({
  showLayerForm,
  showDataSourceForm,
  showConstraintForm = false,
  showChartForm = false,
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
  editingDataSourceIndex = null,
  editingDataSourceLayerIndex = null,
  editingChartIndex = null,
  editingChartLayerIndex = null,
  onSelectType,
  onLayerSaved,
  onLayerFormCancel,
  onDataSourceAdded,
  onStatisticsLayerAdded,
  onConstraintSourceAdded,
  onUpdateConstraintSource,
  onUpdateDataSource,
  onChartAdded,
  onUpdateChart,
  onDataSourceCancel,
  onConstraintFormCancel,
  onChartFormCancel,
  onAddService
}: LayerFormHandlerProps) => {
  // Memoize editing objects at top level to prevent unnecessary form resets
  // CRITICAL: These must be at top level, not inside conditional blocks, to follow Rules of Hooks
  
  // For data source editing - extract the specific data item being edited
  // Serialize the specific item to prevent reference changes from triggering resets
  const editingDataSourceKey = useMemo(() => {
    if (editingDataSourceIndex === null || editingDataSourceLayerIndex === null) {
      return null;
    }
    const layer = config.sources[editingDataSourceLayerIndex];
    if (!layer?.data?.[editingDataSourceIndex]) return null;
    return JSON.stringify(layer.data[editingDataSourceIndex]);
  }, [editingDataSourceIndex, editingDataSourceLayerIndex, config.sources]);

  const editingDataSource = useMemo(() => {
    if (!editingDataSourceKey) return undefined;
    return JSON.parse(editingDataSourceKey);
  }, [editingDataSourceKey]);

  // For constraint editing - extract the specific constraint being edited
  // Serialize the specific constraint to prevent reference changes from triggering resets
  const editingConstraintKey = useMemo(() => {
    if (editingConstraintIndex === null || editingConstraintLayerIndex === null) {
      return null;
    }
    const layer = config.sources[editingConstraintLayerIndex];
    if (!layer?.constraints?.[editingConstraintIndex]) return null;
    return JSON.stringify(layer.constraints[editingConstraintIndex]);
  }, [editingConstraintIndex, editingConstraintLayerIndex, config.sources]);

  const editingConstraint = useMemo(() => {
    if (!editingConstraintKey) return undefined;
    return JSON.parse(editingConstraintKey);
  }, [editingConstraintKey]);

  // For chart editing - extract the specific chart being edited
  const editingChartKey = useMemo(() => {
    if (editingChartIndex === null || editingChartLayerIndex === null) {
      return null;
    }
    const layer = config.sources[editingChartLayerIndex];
    if (!layer?.charts?.[editingChartIndex]) return null;
    return JSON.stringify(layer.charts[editingChartIndex]);
  }, [editingChartIndex, editingChartLayerIndex, config.sources]);

  const editingChart = useMemo(() => {
    if (!editingChartKey) return undefined;
    return JSON.parse(editingChartKey);
  }, [editingChartKey]);

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
    const currentLayer = config.sources[selectedLayerIndex];
    
    if (!currentLayer) {
      console.error('No layer found at index:', selectedLayerIndex, 'Available sources:', config.sources.map(s => s.name));
      return null;
    }
    
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
        editingDataSource={editingDataSource}
        editingIndex={editingDataSourceIndex ?? undefined}
        onUpdateDataSource={onUpdateDataSource}
        editingLayerIndex={editingDataSourceLayerIndex ?? undefined}
      />
    );
  }

  if (showConstraintForm && selectedLayerIndex !== null) {
    const currentLayer = config.sources[selectedLayerIndex];
    
    if (!currentLayer) {
      console.error('No layer found at index:', selectedLayerIndex);
      return null;
    }
    
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
        editingIndex={editingConstraintIndex ?? undefined}
      />
    );
  }

  if (showChartForm && selectedLayerIndex !== null) {
    const currentLayer = config.sources[selectedLayerIndex];
    
    if (!currentLayer) {
      console.error('No layer found at index:', selectedLayerIndex);
      return null;
    }
    
    // Create handler that routes to add or update based on editing state
    const handleChartSubmit = (chart: ChartConfig) => {
      if (editingChartIndex !== null && editingChartLayerIndex !== null && onUpdateChart) {
        onUpdateChart(chart, editingChartLayerIndex, editingChartIndex);
      } else if (onChartAdded) {
        onChartAdded(chart);
      }
    };
    
    return (
      <ChartSourceForm
        services={services}
        onAddChart={handleChartSubmit}
        onCancel={onChartFormCancel || (() => {})}
        editingChart={editingChart}
        editingIndex={editingChartIndex ?? undefined}
        onUpdateChart={onUpdateChart ? (chart, idx) => onUpdateChart(chart, editingChartLayerIndex!, idx) : undefined}
      />
    );
  }

  return null;
};

export default LayerFormHandler;
