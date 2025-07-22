
import { DataSource, LayerType, Service } from '@/types/config';
import { useLayerStateManagement } from '@/hooks/useLayerStateManagement';
import { useLayerActions } from '@/hooks/useLayerActions';
import { useDataSourceActions } from '@/hooks/useDataSourceActions';
import { useInterfaceGroupActions } from '@/hooks/useInterfaceGroupActions';
import { useCompositeHook } from '@/hooks/useCompositeHook';

interface LayersTabCompositionProps {
  config: {
    sources: DataSource[];
    interfaceGroups: string[];
    services: Service[];
    exclusivitySets: string[];
  };
  defaultInterfaceGroup?: string;
  editingLayerIndex: number | null;
  setEditingLayerIndex: (index: number | null) => void;
  setSelectedLayerType: (type: LayerType | null) => void;
  setShowLayerForm: (show: boolean) => void;
  setDefaultInterfaceGroup: (group: string | undefined) => void;
  updateLayer: (index: number, layer: DataSource) => void;
  addLayer: (layer: DataSource) => void;
  updateConfig: (updates: { interfaceGroups?: string[]; sources?: DataSource[] }) => void;
}

/**
 * Composed hook that combines all layers tab logic using hook composition utilities
 */
export const useLayersTabComposition = (props: LayersTabCompositionProps) => {
  const {
    config,
    editingLayerIndex,
    setEditingLayerIndex,
    setSelectedLayerType,
    setShowLayerForm,
    updateLayer,
    addLayer,
    updateConfig
  } = props;

  // Get consolidated layer state management
  const layerState = useLayerStateManagement();
  const layerActions = useLayerActions({
    config,
    updateLayer,
    addLayer,
    setEditingLayerIndex,
    setSelectedLayerType,
    setShowLayerForm
  });
  const dataSourceActions = useDataSourceActions({
    config,
    updateLayer,
    selectedLayerIndex: layerState.selectedLayerIndex,
    handleLayerCreated: layerState.handleLayerCreated,
    handleDataSourceComplete: layerState.handleDataSourceComplete
  });
  const interfaceGroupActions = useInterfaceGroupActions({
    config,
    updateConfig
  });

  return {
    // Layer state management (consolidated)
    ...layerState,
    
    // Layer actions - expose all handler functions
    handleEditLayer: layerActions.handleEditLayer,
    handleEditBaseLayer: layerActions.handleEditBaseLayer,
    handleDuplicateLayer: layerActions.handleDuplicateLayer,
    handleRemoveDataSource: layerActions.handleRemoveDataSource,
    handleRemoveStatisticsSource: layerActions.handleRemoveStatisticsSource,
    handleEditDataSource: layerActions.handleEditDataSource,
    handleEditStatisticsSource: layerActions.handleEditStatisticsSource,
    
    // Data source actions
    handleDataSourceAdded: dataSourceActions.handleDataSourceAdded,
    handleStatisticsLayerAdded: dataSourceActions.handleStatisticsLayerAdded,
    
    // Interface group actions
    handleAddInterfaceGroup: interfaceGroupActions.handleAddInterfaceGroup,
    
    // Custom composed methods
    handleStartDataSourceFormWithExpansion: (layerIndex: number) => {
      console.log('handleStartDataSourceFormWithExpansion called with layerIndex:', layerIndex);
      const layer = config.sources[layerIndex];
      console.log('Layer found:', layer ? layer.name : 'UNDEFINED');
      const groupName = layer?.layout?.interfaceGroup || 'ungrouped';
      const cardId = `${groupName}-${layerIndex}`;
      
      layerState.handleStartDataSourceForm(layerIndex, cardId);
    }
  };
};
