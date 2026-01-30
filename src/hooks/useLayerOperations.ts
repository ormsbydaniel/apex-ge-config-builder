import { useState, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { DataSource, DataSourceItem, LayerType, isDataSourceItemArray } from '@/types/config';
import { ChartConfig } from '@/types/chart';
import { createLayerActionHandlers } from '@/utils/layerActions';
import { PositionValue, getDefaultPosition, isValidPosition, requiresPosition } from '@/utils/positionUtils';

// Layer type management
export type LayerTypeOption = 'standard' | 'swipe' | 'mirror' | 'spotlight';

// Consolidated state interface
interface LayerOperationsState {
  // Form management
  showLayerForm: boolean;
  selectedLayerType: LayerType | null;
  editingLayerIndex: number | null;
  defaultInterfaceGroup?: string;
  defaultSubinterfaceGroup?: string;
  
  // Layer type management  
  selectedLayerTypeOption: LayerTypeOption;
  
  // Position management
  isPositionModalOpen: boolean;
  editingDataSourceIndex: number | null;
}

// Props interface
interface UseLayerOperationsProps {
  config: { sources: DataSource[] };
  dispatch: (action: any) => void;
  initialLayer?: DataSource;
  onLayerTypeChange?: (layerType: LayerTypeOption) => void;
  dataSources?: DataSourceItem[];
  onDataSourcesChange?: (dataSources: DataSourceItem[]) => void;
  selectedLayerIndex?: number | null;
  handleLayerCreated?: (groupName: string, layerIndex: number) => void;
  handleDataSourceComplete?: () => void;
  handleConstraintComplete?: () => void;
  // External state setters (optional - if not provided, will use internal state)
  setShowLayerForm?: (show: boolean) => void;
  setSelectedLayerType?: (type: LayerType | null) => void;
  setEditingLayerIndex?: (index: number | null) => void;
  setDefaultInterfaceGroup?: (group: string | undefined) => void;
  setDefaultSubinterfaceGroup?: (subGroup: string | undefined) => void;
}

export const useLayerOperations = ({
  config,
  dispatch,
  initialLayer,
  onLayerTypeChange,
  dataSources = [],
  onDataSourcesChange = () => {},
  selectedLayerIndex = null,
  handleLayerCreated = () => {},
  handleDataSourceComplete = () => {},
  handleConstraintComplete = () => {},
  // External state setters
  setShowLayerForm: externalSetShowLayerForm,
  setSelectedLayerType: externalSetSelectedLayerType,
  setEditingLayerIndex: externalSetEditingLayerIndex,
  setDefaultInterfaceGroup: externalSetDefaultInterfaceGroup,
  setDefaultSubinterfaceGroup: externalSetDefaultSubinterfaceGroup
}: UseLayerOperationsProps) => {
  const { toast } = useToast();

  // Determine initial layer type from existing layer
  const getInitialLayerType = (): LayerTypeOption => {
    if (!initialLayer) return 'standard';
    
    if ((initialLayer as any).isSwipeLayer) return 'swipe';
    if ((initialLayer as any).isMirrorLayer) return 'mirror';
    if ((initialLayer as any).isSpotlightLayer) return 'spotlight';
    
    return 'standard';
  };

  // Consolidated state
  const [state, setState] = useState<LayerOperationsState>({
    showLayerForm: false,
    selectedLayerType: null,
    editingLayerIndex: null,
    defaultInterfaceGroup: undefined,
    defaultSubinterfaceGroup: undefined,
    selectedLayerTypeOption: getInitialLayerType(),
    isPositionModalOpen: false,
    editingDataSourceIndex: null
  });

  // === LAYER MANAGEMENT ===
  
  const addLayer = useCallback((layer: DataSource) => {
    dispatch({ type: 'ADD_SOURCE', payload: layer });
    setState(prev => ({
      ...prev,
      showLayerForm: false,
      selectedLayerType: null,
      defaultInterfaceGroup: undefined,
      defaultSubinterfaceGroup: undefined
    }));
  }, [dispatch]);

  const removeLayer = useCallback((index: number) => {
    dispatch({ type: 'REMOVE_SOURCE', payload: index });
  }, [dispatch]);

  const updateLayer = useCallback((index: number, layer: DataSource) => {
    const updatedSources = [...config.sources];
    updatedSources[index] = layer;
    dispatch({ type: 'UPDATE_SOURCES', payload: updatedSources });
  }, [config.sources, dispatch]);

  const moveLayer = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    const newSources = [...config.sources];
    const [movedLayer] = newSources.splice(fromIndex, 1);
    newSources.splice(toIndex, 0, movedLayer);
    
    dispatch({ type: 'UPDATE_SOURCES', payload: newSources });
    
    toast({
      title: "Layer Moved",
      description: "Layer order has been updated.",
    });
  }, [config.sources, dispatch, toast]);

  const moveLayerToTop = useCallback((layerIndex: number, groupIndices: number[]) => {
    if (groupIndices.length === 0) return;
    
    const firstIndexInGroup = Math.min(...groupIndices);
    if (layerIndex === firstIndexInGroup) return;
    
    moveLayer(layerIndex, firstIndexInGroup);
  }, [moveLayer]);

  const moveLayerToBottom = useCallback((layerIndex: number, groupIndices: number[]) => {
    if (groupIndices.length === 0) return;
    
    const lastIndexInGroup = Math.max(...groupIndices);
    if (layerIndex === lastIndexInGroup) return;
    
    moveLayer(layerIndex, lastIndexInGroup);
  }, [moveLayer]);

  // === FORM MANAGEMENT ===
  // Use external setters if provided, otherwise use internal state

  const setShowLayerForm = useCallback((show: boolean) => {
    if (externalSetShowLayerForm) {
      externalSetShowLayerForm(show);
    } else {
      setState(prev => ({ ...prev, showLayerForm: show }));
    }
  }, [externalSetShowLayerForm]);

  const setSelectedLayerType = useCallback((type: LayerType | null) => {
    if (externalSetSelectedLayerType) {
      externalSetSelectedLayerType(type);
    } else {
      setState(prev => ({ ...prev, selectedLayerType: type }));
    }
  }, [externalSetSelectedLayerType]);

  const setEditingLayerIndex = useCallback((index: number | null) => {
    if (externalSetEditingLayerIndex) {
      externalSetEditingLayerIndex(index);
    } else {
      setState(prev => ({ ...prev, editingLayerIndex: index }));
    }
  }, [externalSetEditingLayerIndex]);

  const setDefaultInterfaceGroup = useCallback((group: string | undefined) => {
    if (externalSetDefaultInterfaceGroup) {
      externalSetDefaultInterfaceGroup(group);
    } else {
      setState(prev => ({ ...prev, defaultInterfaceGroup: group }));
    }
  }, [externalSetDefaultInterfaceGroup]);

  const setDefaultSubinterfaceGroup = useCallback((subGroup: string | undefined) => {
    if (externalSetDefaultSubinterfaceGroup) {
      externalSetDefaultSubinterfaceGroup(subGroup);
    } else {
      setState(prev => ({ ...prev, defaultSubinterfaceGroup: subGroup }));
    }
  }, [externalSetDefaultSubinterfaceGroup]);

  const handleLayerTypeSelect = useCallback((type: LayerType) => {
    setSelectedLayerType(type);
  }, [setSelectedLayerType]);

  const handleCancelLayerForm = useCallback(() => {
    setShowLayerForm(false);
    setSelectedLayerType(null);
    setEditingLayerIndex(null);
    setDefaultInterfaceGroup(undefined);
    setDefaultSubinterfaceGroup(undefined);
  }, [setShowLayerForm, setSelectedLayerType, setEditingLayerIndex, setDefaultInterfaceGroup, setDefaultSubinterfaceGroup]);

  // === LAYER TYPE MANAGEMENT ===

  const handleLayerTypeChange = useCallback((newType: LayerTypeOption) => {
    setState(prev => ({ ...prev, selectedLayerTypeOption: newType }));
    onLayerTypeChange?.(newType);
  }, [onLayerTypeChange]);

  const getLayerTypeFlags = useCallback((layerType: LayerTypeOption) => {
    const flags: Record<string, boolean> = {};
    
    // Remove all layer type flags first
    delete flags.isSwipeLayer;
    delete flags.isMirrorLayer;
    delete flags.isSpotlightLayer;
    
    // Set the appropriate flag
    switch (layerType) {
      case 'swipe':
        flags.isSwipeLayer = true;
        break;
      case 'mirror':
        flags.isMirrorLayer = true;
        break;
      case 'spotlight':
        flags.isSpotlightLayer = true;
        break;
      // 'standard' type has no special flags
    }
    
    return flags;
  }, []);

  const isComparisonLayerType = useCallback((layerType: LayerTypeOption): boolean => {
    return ['swipe', 'mirror', 'spotlight'].includes(layerType);
  }, []);

  // === POSITION MANAGEMENT ===

  const updateDataSourcePosition = useCallback((index: number, position: PositionValue) => {
    if (!isValidPosition(state.selectedLayerTypeOption, position)) {
      console.warn(`Invalid position ${position} for layer type ${state.selectedLayerTypeOption}`);
      return;
    }

    const updatedDataSources = [...dataSources];
    updatedDataSources[index] = {
      ...updatedDataSources[index],
      position
    };
    
    onDataSourcesChange(updatedDataSources);
  }, [state.selectedLayerTypeOption, dataSources, onDataSourcesChange]);

  const openPositionEditor = useCallback((dataSourceIndex: number) => {
    setState(prev => ({
      ...prev,
      editingDataSourceIndex: dataSourceIndex,
      isPositionModalOpen: true
    }));
  }, []);

  const closePositionEditor = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPositionModalOpen: false,
      editingDataSourceIndex: null
    }));
  }, []);

  const ensureDataSourcesHavePositions = useCallback(() => {
    if (!requiresPosition(state.selectedLayerTypeOption)) {
      // Remove positions for standard layers
      const updatedDataSources = dataSources.map(ds => {
        const { position, ...rest } = ds as any;
        return rest;
      });
      onDataSourcesChange(updatedDataSources);
      return [];
    }

    const defaultPosition = getDefaultPosition(state.selectedLayerTypeOption);
    const dataSourcesNeedingPositions: number[] = [];

    const updatedDataSources = dataSources.map((ds, index) => {
      const currentPosition = (ds as any).position;
      
      if (!currentPosition || !isValidPosition(state.selectedLayerTypeOption, currentPosition)) {
        dataSourcesNeedingPositions.push(index);
        return {
          ...ds,
          position: defaultPosition
        };
      }
      
      return ds;
    });

    if (dataSourcesNeedingPositions.length > 0) {
      onDataSourcesChange(updatedDataSources);
    }

    return dataSourcesNeedingPositions;
  }, [state.selectedLayerTypeOption, dataSources, onDataSourcesChange]);

  const removePositionsFromDataSources = useCallback(() => {
    const updatedDataSources = dataSources.map(ds => {
      const { position, ...rest } = ds as any;
      return rest;
    });
    onDataSourcesChange(updatedDataSources);
  }, [dataSources, onDataSourcesChange]);

  // === DATA SOURCE ACTIONS ===

  const handleDataSourceAdded = useCallback((dataSource: any | any[]) => {
    if (selectedLayerIndex !== null) {
      const layer = config.sources[selectedLayerIndex];
      if (isDataSourceItemArray(layer.data)) {
        // Handle both single data source and array of data sources
        const dataSourcesToAdd = Array.isArray(dataSource) ? dataSource : [dataSource];
        const updatedLayer = {
          ...layer,
          data: [...layer.data, ...dataSourcesToAdd]
        };
        updateLayer(selectedLayerIndex, updatedLayer);
        
        const groupName = layer.layout?.interfaceGroup || 'ungrouped';
        handleLayerCreated(groupName, selectedLayerIndex);
      }
    }
    handleDataSourceComplete();
  }, [selectedLayerIndex, config.sources, updateLayer, handleLayerCreated, handleDataSourceComplete]);

  const handleStatisticsLayerAdded = useCallback((statisticsItem: any | any[]) => {
    if (selectedLayerIndex !== null) {
      const layer = config.sources[selectedLayerIndex];
      // Handle both single and array of statistics items
      const itemsToAdd = Array.isArray(statisticsItem) ? statisticsItem : [statisticsItem];
      const updatedLayer = {
        ...layer,
        statistics: [...(layer.statistics || []), ...itemsToAdd]
      };
      updateLayer(selectedLayerIndex, updatedLayer);
      
      const groupName = layer.layout?.interfaceGroup || 'ungrouped';
      handleLayerCreated(groupName, selectedLayerIndex);
    }
    handleDataSourceComplete();
  }, [selectedLayerIndex, config.sources, updateLayer, handleLayerCreated, handleDataSourceComplete]);

  const handleConstraintSourceAdded = useCallback((constraintItem: any | any[]) => {
    if (selectedLayerIndex !== null) {
      const layer = config.sources[selectedLayerIndex];
      const existingConstraints = layer.constraints || [];
      
      // Calculate next bandIndex: start at 2, or max + 1
      const nextBandIndex = existingConstraints.length > 0 
        ? Math.max(...existingConstraints.map(c => c.bandIndex || 1)) + 1 
        : 2;
      
      // Handle both single and array of constraint items
      const itemsToAdd = Array.isArray(constraintItem) ? constraintItem : [constraintItem];
      
      // Add bandIndex to items that don't have one (new constraints)
      const itemsWithBandIndex = itemsToAdd.map((item, index) => ({
        ...item,
        bandIndex: item.bandIndex !== undefined ? item.bandIndex : nextBandIndex + index
      }));
      
      const updatedLayer = {
        ...layer,
        constraints: [...existingConstraints, ...itemsWithBandIndex]
      };
      updateLayer(selectedLayerIndex, updatedLayer);
      
      const groupName = layer.layout?.interfaceGroup || 'ungrouped';
      handleLayerCreated(groupName, selectedLayerIndex);
    }
    handleConstraintComplete();
  }, [selectedLayerIndex, config.sources, updateLayer, handleLayerCreated, handleConstraintComplete]);

  const handleUpdateConstraintSource = useCallback((constraintItem: any, layerIndex: number, constraintIndex: number) => {
    const layer = config.sources[layerIndex];
    if (!layer) return;
    
    const updatedConstraints = [...(layer.constraints || [])];
    updatedConstraints[constraintIndex] = constraintItem;
    
    const updatedLayer = {
      ...layer,
      constraints: updatedConstraints
    };
    
    updateLayer(layerIndex, updatedLayer);
    
    const groupName = layer.layout?.interfaceGroup || 'ungrouped';
    handleLayerCreated(groupName, layerIndex);
    
    handleConstraintComplete();
  }, [config.sources, updateLayer, handleLayerCreated, handleConstraintComplete]);

  const handleEditConstraintSource = useCallback((layerIndex: number, constraintIndex: number) => {
    // This will be overridden by composition layer to include expansion
  }, []);

  const handleUpdateDataSource = useCallback((dataSourceItem: any, layerIndex: number, dataSourceIndex: number) => {
    const layer = config.sources[layerIndex];
    if (!layer) return;
    
    const updatedData = [...(layer.data || [])];
    updatedData[dataSourceIndex] = dataSourceItem;
    
    const updatedLayer = {
      ...layer,
      data: updatedData
    };
    
    updateLayer(layerIndex, updatedLayer);
    
    const groupName = layer.layout?.interfaceGroup || 'ungrouped';
    handleLayerCreated(groupName, layerIndex);
    
    handleDataSourceComplete();
  }, [config.sources, updateLayer, handleLayerCreated, handleDataSourceComplete]);

  const handleEditDataSource = useCallback((layerIndex: number, dataSourceIndex: number) => {
    // This will be overridden by composition layer to include expansion
  }, []);

  const handleStartConstraintForm = useCallback((layerIndex: number) => {
    // This will be overridden by the composition layer if needed
  }, []);

  const handleCancelConstraintForm = useCallback(() => {
    handleDataSourceComplete();
  }, [handleDataSourceComplete]);

  // === CHART OPERATIONS ===

  const addChart = useCallback((layerIndex: number, chart: ChartConfig) => {
    const layer = config.sources[layerIndex];
    if (!layer) return;
    
    const updatedLayer = {
      ...layer,
      charts: [...(layer.charts || []), chart]
    };
    updateLayer(layerIndex, updatedLayer);
    
    toast({
      title: "Chart Added",
      description: "Chart has been added to the layer.",
    });
  }, [config.sources, updateLayer, toast]);

  const removeChart = useCallback((layerIndex: number, chartIndex: number) => {
    const layer = config.sources[layerIndex];
    if (!layer || !layer.charts) return;
    
    const updatedCharts = [...layer.charts];
    updatedCharts.splice(chartIndex, 1);
    
    const updatedLayer = {
      ...layer,
      charts: updatedCharts
    };
    updateLayer(layerIndex, updatedLayer);
    
    toast({
      title: "Chart Removed",
      description: "Chart has been removed from the layer.",
    });
  }, [config.sources, updateLayer, toast]);

  const updateChart = useCallback((layerIndex: number, chartIndex: number, chart: ChartConfig) => {
    const layer = config.sources[layerIndex];
    if (!layer || !layer.charts) return;
    
    const updatedCharts = [...layer.charts];
    updatedCharts[chartIndex] = chart;
    
    const updatedLayer = {
      ...layer,
      charts: updatedCharts
    };
    updateLayer(layerIndex, updatedLayer);
    
    toast({
      title: "Chart Updated",
      description: "Chart configuration has been updated.",
    });
  }, [config.sources, updateLayer, toast]);

  // === LAYER ACTIONS ===

  const layerActionHandlers = useMemo(() => {
    return createLayerActionHandlers(
      config,
      updateLayer,
      addLayer,
      setEditingLayerIndex,
      setSelectedLayerType,
      setShowLayerForm
    );
  }, [config, updateLayer, addLayer, setEditingLayerIndex, setSelectedLayerType, setShowLayerForm]);

  // === CONFIG UPDATES ===

  const updateConfig = useCallback((updates: { interfaceGroups?: string[]; sources?: DataSource[]; services?: any[] }) => {
    if (updates.interfaceGroups) {
      dispatch({ type: 'UPDATE_INTERFACE_GROUPS', payload: updates.interfaceGroups });
    }
    if (updates.sources) {
      dispatch({ type: 'UPDATE_SOURCES', payload: updates.sources });
    }
  }, [dispatch]);

  const result = {
    // State
    ...state,
    
    // Layer management
    addLayer,
    removeLayer,
    updateLayer,
    moveLayer,
    moveLayerToTop,
    moveLayerToBottom,
    updateConfig,
    
    // Form management
    setShowLayerForm,
    setSelectedLayerType,
    setEditingLayerIndex,
    setDefaultInterfaceGroup,
    setDefaultSubinterfaceGroup,
    handleLayerTypeSelect,
    handleCancelLayerForm,
    
    // Layer type management
    handleLayerTypeChange,
    getLayerTypeFlags,
    isComparisonLayerType,
    
    // Position management
    updateDataSourcePosition,
    openPositionEditor,
    closePositionEditor,
    ensureDataSourcesHavePositions,
    removePositionsFromDataSources,
    
    // Data source actions
    handleDataSourceAdded,
    handleStatisticsLayerAdded,
    handleConstraintSourceAdded,
    handleUpdateConstraintSource,
    handleEditConstraintSource,
    handleUpdateDataSource,
    handleEditDataSource,
    handleStartConstraintForm,
    handleCancelConstraintForm,
    
    // Chart operations
    addChart,
    removeChart,
    updateChart,
    
    // Layer actions (from utility)
    ...layerActionHandlers
  };
  
  return result;
};