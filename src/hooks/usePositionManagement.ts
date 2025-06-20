
import { useState, useCallback } from 'react';
import { DataSourceItem } from '@/types/config';
import { LayerTypeOption } from '@/hooks/useLayerTypeManagement';
import { PositionValue, getDefaultPosition, isValidPosition, requiresPosition } from '@/utils/positionUtils';

interface UsePositionManagementProps {
  layerType: LayerTypeOption;
  dataSources: DataSourceItem[];
  onDataSourcesChange: (dataSources: DataSourceItem[]) => void;
}

export const usePositionManagement = ({
  layerType,
  dataSources,
  onDataSourcesChange
}: UsePositionManagementProps) => {
  const [isPositionModalOpen, setIsPositionModalOpen] = useState(false);
  const [editingDataSourceIndex, setEditingDataSourceIndex] = useState<number | null>(null);

  const updateDataSourcePosition = useCallback((index: number, position: PositionValue) => {
    if (!isValidPosition(layerType, position)) {
      console.warn(`Invalid position ${position} for layer type ${layerType}`);
      return;
    }

    const updatedDataSources = [...dataSources];
    updatedDataSources[index] = {
      ...updatedDataSources[index],
      position
    };
    
    onDataSourcesChange(updatedDataSources);
  }, [layerType, dataSources, onDataSourcesChange]);

  const openPositionEditor = useCallback((dataSourceIndex: number) => {
    setEditingDataSourceIndex(dataSourceIndex);
    setIsPositionModalOpen(true);
  }, []);

  const closePositionEditor = useCallback(() => {
    setIsPositionModalOpen(false);
    setEditingDataSourceIndex(null);
  }, []);

  const ensureDataSourcesHavePositions = useCallback(() => {
    if (!requiresPosition(layerType)) {
      // Remove positions for standard layers
      const updatedDataSources = dataSources.map(ds => {
        const { position, ...rest } = ds as any;
        return rest;
      });
      onDataSourcesChange(updatedDataSources);
      return [];
    }

    const defaultPosition = getDefaultPosition(layerType);
    const dataSourcesNeedingPositions: number[] = [];

    const updatedDataSources = dataSources.map((ds, index) => {
      const currentPosition = (ds as any).position;
      
      if (!currentPosition || !isValidPosition(layerType, currentPosition)) {
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
  }, [layerType, dataSources, onDataSourcesChange]);

  const removePositionsFromDataSources = useCallback(() => {
    const updatedDataSources = dataSources.map(ds => {
      const { position, ...rest } = ds as any;
      return rest;
    });
    onDataSourcesChange(updatedDataSources);
  }, [dataSources, onDataSourcesChange]);

  return {
    isPositionModalOpen,
    editingDataSourceIndex,
    updateDataSourcePosition,
    openPositionEditor,
    closePositionEditor,
    ensureDataSourcesHavePositions,
    removePositionsFromDataSources
  };
};
