
import { DataSource, isDataSourceItemArray } from '@/types/config';

interface UseDataSourceActionsProps {
  config: {
    sources: DataSource[];
  };
  updateLayer: (index: number, layer: DataSource) => void;
  selectedLayerIndex: number | null;
  handleLayerCreated: (groupName: string, layerIndex: number) => void;
  handleDataSourceComplete: () => void;
}

export const useDataSourceActions = ({
  config,
  updateLayer,
  selectedLayerIndex,
  handleLayerCreated,
  handleDataSourceComplete
}: UseDataSourceActionsProps) => {
  const handleDataSourceAdded = (dataSource: any) => {
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
  };

  const handleStatisticsLayerAdded = (statisticsItem: any) => {
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
  };

  return {
    handleDataSourceAdded,
    handleStatisticsLayerAdded
  };
};
