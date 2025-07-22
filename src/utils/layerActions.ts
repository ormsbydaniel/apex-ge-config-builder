
import { DataSource, isDataSourceItemArray } from '@/types/config';

export const createLayerActionHandlers = (
  config: { sources: DataSource[] },
  updateLayer: (index: number, layer: DataSource) => void,
  addLayer: (layer: DataSource) => void,
  setEditingLayerIndex: (index: number | null) => void,
  setSelectedLayerType: (type: any) => void,
  setShowLayerForm: (show: boolean) => void
) => {
  const handleEditLayer = (layerIndex: number) => {
    const layer = config.sources[layerIndex];
    const isSwipeLayer = layer.meta?.swipeConfig !== undefined;
    
    setEditingLayerIndex(layerIndex);
    setSelectedLayerType(isSwipeLayer ? 'swipe' : 'layerCard');
    setShowLayerForm(true);
  };

  const handleEditBaseLayer = (layerIndex: number) => {
    setEditingLayerIndex(layerIndex);
    setSelectedLayerType('base');
    setShowLayerForm(true);
  };

  const handleDuplicateLayer = (layerIndex: number) => {
    const originalLayer = config.sources[layerIndex];
    const duplicatedLayer: DataSource = {
      ...originalLayer,
      name: `${originalLayer.name} (Copy)`,
      // Deep clone the data array to avoid reference issues - only if it's an array
      data: isDataSourceItemArray(originalLayer.data) 
        ? originalLayer.data.map(dataItem => ({ ...dataItem }))
        : originalLayer.data,
      // Deep clone statistics array if it exists
      statistics: originalLayer.statistics 
        ? originalLayer.statistics.map(statsItem => ({ ...statsItem }))
        : undefined,
      // Deep clone meta if it exists, including gradient fields and swipe config
      ...(originalLayer.meta && {
        meta: {
          ...originalLayer.meta,
          attribution: { ...originalLayer.meta.attribution },
          categories: originalLayer.meta.categories ? [...originalLayer.meta.categories] : undefined,
          // Include gradient fields if they exist
          ...(originalLayer.meta.startColor && { startColor: originalLayer.meta.startColor }),
          ...(originalLayer.meta.endColor && { endColor: originalLayer.meta.endColor }),
          ...(originalLayer.meta.min !== undefined && { min: originalLayer.meta.min }),
          ...(originalLayer.meta.max !== undefined && { max: originalLayer.meta.max }),
          // Deep clone swipe config if it exists
          ...(originalLayer.meta.swipeConfig && {
            swipeConfig: { ...originalLayer.meta.swipeConfig }
          })
        }
      }),
      // Deep clone layout if it exists
      ...(originalLayer.layout && {
        layout: {
          ...originalLayer.layout,
          layerCard: originalLayer.layout.layerCard ? {
            ...originalLayer.layout.layerCard,
            legend: originalLayer.layout.layerCard.legend ? { 
              ...originalLayer.layout.layerCard.legend 
            } : undefined,
            controls: originalLayer.layout.layerCard.controls ? { ...originalLayer.layout.layerCard.controls } : undefined
          } : undefined
        }
      })
    };
    
    addLayer(duplicatedLayer);
  };

  const handleRemoveDataSource = (layerIndex: number, dataSourceIndex: number) => {
    const layer = config.sources[layerIndex];
    if (isDataSourceItemArray(layer.data)) {
      const updatedLayer = {
        ...layer,
        data: layer.data.filter((_, index) => index !== dataSourceIndex)
      };
      updateLayer(layerIndex, updatedLayer);
    }
  };

  const handleRemoveStatisticsSource = (layerIndex: number, statsIndex: number) => {
    const layer = config.sources[layerIndex];
    if (layer.statistics) {
      const updatedLayer = {
        ...layer,
        statistics: layer.statistics.filter((_, index) => index !== statsIndex)
      };
      updateLayer(layerIndex, updatedLayer);
    }
  };

  const handleEditDataSource = (layerIndex: number, dataIndex: number) => {
    // Placeholder for Phase 2 implementation
    console.log(`Edit data source at layer ${layerIndex}, data index ${dataIndex}`);
  };

  const handleEditStatisticsSource = (layerIndex: number, statsIndex: number) => {
    // Placeholder for Phase 2 implementation
    console.log(`Edit statistics source at layer ${layerIndex}, stats index ${statsIndex}`);
  };

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
