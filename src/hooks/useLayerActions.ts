
import { DataSource, LayerType } from '@/types/config';
import { createLayerActionHandlers } from '@/utils/layerActions';

interface UseLayerActionsProps {
  config: {
    sources: DataSource[];
  };
  updateLayer: (index: number, layer: DataSource) => void;
  addLayer: (layer: DataSource) => void;
  setEditingLayerIndex: (index: number | null) => void;
  setSelectedLayerType: (type: LayerType | null) => void;
  setShowLayerForm: (show: boolean) => void;
}

export const useLayerActions = ({
  config,
  updateLayer,
  addLayer,
  setEditingLayerIndex,
  setSelectedLayerType,
  setShowLayerForm
}: UseLayerActionsProps) => {
  const {
    handleEditLayer,
    handleEditBaseLayer,
    handleDuplicateLayer,
    handleRemoveDataSource,
    handleRemoveStatisticsSource,
    handleEditDataSource,
    handleEditStatisticsSource
  } = createLayerActionHandlers(
    config,
    updateLayer,
    addLayer,
    setEditingLayerIndex,
    setSelectedLayerType,
    setShowLayerForm
  );

  return {
    handleEditLayer,
    handleEditBaseLayer,
    handleDuplicateLayer,
    handleRemoveDataSource,
    handleRemoveStatisticsSource,
    handleEditDataSource,
    handleEditStatisticsSource
  };
};
