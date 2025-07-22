
import { DataSource, DataSourceItem } from '@/types/config';
import { LayerTypeOption } from '@/hooks/useLayerOperations';
import { requiresPosition, getDefaultPosition } from '@/utils/positionUtils';

export interface LayerTypeMigrationResult {
  needsPositionAssignment: boolean;
  dataSourcesNeedingPositions: number[];
  warningMessage?: string;
}

export const analyzeLayerTypeMigration = (
  currentLayer: DataSource,
  newLayerType: LayerTypeOption
): LayerTypeMigrationResult => {
  const currentData = currentLayer.data || [];
  const currentRequiresPosition = hasAnyDataSourcePositions(currentData);
  const newRequiresPosition = requiresPosition(newLayerType);

  // Standard to comparison layer
  if (!currentRequiresPosition && newRequiresPosition) {
    return {
      needsPositionAssignment: true,
      dataSourcesNeedingPositions: currentData.map((_, index) => index),
      warningMessage: `Switching to ${newLayerType} layer requires position assignment for all data sources.`
    };
  }

  // Comparison to standard layer
  if (currentRequiresPosition && !newRequiresPosition) {
    return {
      needsPositionAssignment: false,
      dataSourcesNeedingPositions: [],
      warningMessage: 'Switching to standard layer will remove all position settings from data sources.'
    };
  }

  // Between comparison layers - check if positions are valid
  if (currentRequiresPosition && newRequiresPosition) {
    const dataSourcesNeedingPositions: number[] = [];
    currentData.forEach((ds, index) => {
      const position = (ds as any).position;
      if (!position) {
        dataSourcesNeedingPositions.push(index);
      }
    });

    return {
      needsPositionAssignment: dataSourcesNeedingPositions.length > 0,
      dataSourcesNeedingPositions,
      warningMessage: dataSourcesNeedingPositions.length > 0 
        ? `Some data sources need position assignment for ${newLayerType} layer.`
        : undefined
    };
  }

  return {
    needsPositionAssignment: false,
    dataSourcesNeedingPositions: []
  };
};

export const applyLayerTypeMigration = (
  layer: DataSource,
  newLayerType: LayerTypeOption
): DataSource => {
  const updatedLayer = { ...layer };

  // Remove all layer type flags
  delete (updatedLayer as any).isSwipeLayer;
  delete (updatedLayer as any).isMirrorLayer;
  delete (updatedLayer as any).isSpotlightLayer;

  // Set new layer type flag
  switch (newLayerType) {
    case 'swipe':
      (updatedLayer as any).isSwipeLayer = true;
      break;
    case 'mirror':
      (updatedLayer as any).isMirrorLayer = true;
      break;
    case 'spotlight':
      (updatedLayer as any).isSpotlightLayer = true;
      break;
    // 'standard' has no special flags
  }

  // Handle data source positions
  if (requiresPosition(newLayerType)) {
    const defaultPosition = getDefaultPosition(newLayerType);
    updatedLayer.data = updatedLayer.data?.map(ds => ({
      ...ds,
      position: (ds as any).position || defaultPosition
    })) || [];
  } else {
    // Remove positions for standard layers
    updatedLayer.data = updatedLayer.data?.map(ds => {
      const { position, ...rest } = ds as any;
      return rest;
    }) || [];
  }

  return updatedLayer;
};

const hasAnyDataSourcePositions = (dataSources: DataSourceItem[]): boolean => {
  return dataSources.some(ds => (ds as any).position !== undefined);
};
