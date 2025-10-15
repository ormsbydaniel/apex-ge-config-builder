
import { useCallback } from 'react';
import { DataSource, isDataSourceItemArray } from '@/types/config';
import { autoTuneZLevels } from '@/utils/drawOrderUtils';

interface UseDrawOrderActionsProps {
  config: { sources: DataSource[] };
  updateConfig: (updates: { sources?: DataSource[] }) => void;
}

export const useDrawOrderActions = ({ config, updateConfig }: UseDrawOrderActionsProps) => {
  const updateZLevel = useCallback((rowKey: string, newZLevel: number) => {
    const [sourceIndex, sourceType, itemIndex] = rowKey.split('-');
    const newSources = [...config.sources];
    const source = newSources[parseInt(sourceIndex)];
    
    if (sourceType === 'data' && isDataSourceItemArray(source.data)) {
      const newData = [...source.data];
      const dataItem = newData[parseInt(itemIndex)];
      dataItem.zIndex = Math.max(0, newZLevel);
      newData[parseInt(itemIndex)] = dataItem;
      newSources[parseInt(sourceIndex)] = { ...source, data: newData };
    } else if (sourceType === 'statistics' && source.statistics) {
      const newStatistics = [...source.statistics];
      const statsItem = newStatistics[parseInt(itemIndex)];
      statsItem.zIndex = Math.max(0, newZLevel);
      newStatistics[parseInt(itemIndex)] = statsItem;
      newSources[parseInt(sourceIndex)] = { ...source, statistics: newStatistics };
    }
    
    updateConfig({ sources: newSources });
  }, [config.sources, updateConfig]);

  const adjustSelectedZLevels = useCallback((selectedRows: Set<string>, adjustment: number) => {
    if (selectedRows.size === 0) return;

    const newSources = [...config.sources];
    
    selectedRows.forEach(rowKey => {
      const [sourceIndex, sourceType, itemIndex] = rowKey.split('-');
      const source = newSources[parseInt(sourceIndex)];
      
      if (sourceType === 'data' && isDataSourceItemArray(source.data)) {
        const newData = [...source.data];
        const dataItem = newData[parseInt(itemIndex)];
        dataItem.zIndex = Math.max(0, dataItem.zIndex + adjustment);
        newData[parseInt(itemIndex)] = dataItem;
        newSources[parseInt(sourceIndex)] = { ...source, data: newData };
      } else if (sourceType === 'statistics' && source.statistics) {
        const newStatistics = [...source.statistics];
        const statsItem = newStatistics[parseInt(itemIndex)];
        statsItem.zIndex = Math.max(0, statsItem.zIndex + adjustment);
        newStatistics[parseInt(itemIndex)] = statsItem;
        newSources[parseInt(sourceIndex)] = { ...source, statistics: newStatistics };
      }
    });
    
    updateConfig({ sources: newSources });
  }, [config.sources, updateConfig]);

  const setSelectedZLevels = useCallback((selectedRows: Set<string>, zLevel: number) => {
    if (selectedRows.size === 0) return;

    const newSources = [...config.sources];
    
    selectedRows.forEach(rowKey => {
      const [sourceIndex, sourceType, itemIndex] = rowKey.split('-');
      const source = newSources[parseInt(sourceIndex)];
      
      if (sourceType === 'data' && isDataSourceItemArray(source.data)) {
        const newData = [...source.data];
        const dataItem = newData[parseInt(itemIndex)];
        dataItem.zIndex = Math.max(0, zLevel);
        newData[parseInt(itemIndex)] = dataItem;
        newSources[parseInt(sourceIndex)] = { ...source, data: newData };
      } else if (sourceType === 'statistics' && source.statistics) {
        const newStatistics = [...source.statistics];
        const statsItem = newStatistics[parseInt(itemIndex)];
        statsItem.zIndex = Math.max(0, zLevel);
        newStatistics[parseInt(itemIndex)] = statsItem;
        newSources[parseInt(sourceIndex)] = { ...source, statistics: newStatistics };
      }
    });
    
    updateConfig({ sources: newSources });
  }, [config.sources, updateConfig]);

  const multiplySelectedZLevels = useCallback((selectedRows: Set<string>, multiplier: number) => {
    if (selectedRows.size === 0) return;

    const newSources = [...config.sources];
    
    selectedRows.forEach(rowKey => {
      const [sourceIndex, sourceType, itemIndex] = rowKey.split('-');
      const source = newSources[parseInt(sourceIndex)];
      
      if (sourceType === 'data' && isDataSourceItemArray(source.data)) {
        const newData = [...source.data];
        const dataItem = newData[parseInt(itemIndex)];
        dataItem.zIndex = Math.max(0, Math.round(dataItem.zIndex * multiplier));
        newData[parseInt(itemIndex)] = dataItem;
        newSources[parseInt(sourceIndex)] = { ...source, data: newData };
      } else if (sourceType === 'statistics' && source.statistics) {
        const newStatistics = [...source.statistics];
        const statsItem = newStatistics[parseInt(itemIndex)];
        statsItem.zIndex = Math.max(0, Math.round(statsItem.zIndex * multiplier));
        newStatistics[parseInt(itemIndex)] = statsItem;
        newSources[parseInt(sourceIndex)] = { ...source, statistics: newStatistics };
      }
    });
    
    updateConfig({ sources: newSources });
  }, [config.sources, updateConfig]);

  const autoTuneAllZLevels = useCallback(() => {
    const tunedSources = autoTuneZLevels(config.sources);
    updateConfig({ sources: tunedSources });
  }, [config.sources, updateConfig]);

  return {
    updateZLevel,
    adjustSelectedZLevels,
    setSelectedZLevels,
    multiplySelectedZLevels,
    autoTuneAllZLevels
  };
};
