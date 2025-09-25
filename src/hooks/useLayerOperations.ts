import { useState, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { DataSource, DataSourceItem, LayerType, isDataSourceItemArray } from '@/types/config';
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
  // External state setters (optional - if not provided, will use internal state)
  setShowLayerForm?: (show: boolean) => void;
  setSelectedLayerType?: (type: LayerType | null) => void;
  setEditingLayerIndex?: (index: number | null) => void;
  setDefaultInterfaceGroup?: (group: string | undefined) => void;
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
  // External state setters
  setShowLayerForm: externalSetShowLayerForm,
  setSelectedLayerType: externalSetSelectedLayerType,
  setEditingLayerIndex: externalSetEditingLayerIndex,
  setDefaultInterfaceGroup: externalSetDefaultInterfaceGroup
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
      defaultInterfaceGroup: undefined
    }));
  }, [dispatch]);

  const removeLayer = useCallback((index: number) => {
    dispatch({ type: 'REMOVE_SOURCE', payload: index });
  }, [dispatch]);

  const updateLayer = useCallback((index: number, layer: DataSource) => {
    console.log('useLayerOperations: Updating layer at index', index, 'with layer:', layer);
    console.log('useLayerOperations: Layer meta colormaps:', layer.meta?.colormaps);
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

  const handleLayerTypeSelect = useCallback((type: LayerType) => {
    setSelectedLayerType(type);
  }, [setSelectedLayerType]);

  const handleCancelLayerForm = useCallback(() => {
    setShowLayerForm(false);
    setSelectedLayerType(null);
    setEditingLayerIndex(null);
    setDefaultInterfaceGroup(undefined);
  }, [setShowLayerForm, setSelectedLayerType, setEditingLayerIndex, setDefaultInterfaceGroup]);

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

  const handleDataSourceAdded = useCallback((dataSource: any) => {
    if (selectedLayerIndex !== null) {
      const layer = config.sources[selectedLayerIndex];
      if (isDataSourceItemArray(layer.data)) {
        const updatedLayer = {
          ...layer,
          data: [...layer.data, dataSource]
        };
        updateLayer(selectedLayerIndex, updatedLayer);
        
        const groupName = layer.layout?.interfaceGroup || 'ungrouped';
        handleLayerCreated(groupName, selectedLayerIndex);
      }
    }
    handleDataSourceComplete();
  }, [selectedLayerIndex, config.sources, updateLayer, handleLayerCreated, handleDataSourceComplete]);

  const handleStatisticsLayerAdded = useCallback((statisticsItem: any) => {
    if (selectedLayerIndex !== null) {
      const layer = config.sources[selectedLayerIndex];
      const updatedLayer = {
        ...layer,
        statistics: [...(layer.statistics || []), statisticsItem]
      };
      updateLayer(selectedLayerIndex, updatedLayer);
      
      const groupName = layer.layout?.interfaceGroup || 'ungrouped';
      handleLayerCreated(groupName, selectedLayerIndex);
    }
    handleDataSourceComplete();
  }, [selectedLayerIndex, config.sources, updateLayer, handleLayerCreated, handleDataSourceComplete]);

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
    updateConfig,
    
    // Form management
    setShowLayerForm,
    setSelectedLayerType,
    setEditingLayerIndex,
    setDefaultInterfaceGroup,
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
    
    // Layer actions (from utility)
    ...layerActionHandlers
  };
  
  return result;
};