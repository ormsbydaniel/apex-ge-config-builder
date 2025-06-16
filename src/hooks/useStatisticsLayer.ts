
import { useState, useCallback } from 'react';
import { DataSourceItem } from '@/types/config';

export const useStatisticsLayer = (currentLayerStatistics: DataSourceItem[] = []) => {
  const [isStatisticsLayer, setIsStatisticsLayer] = useState(false);

  const getNextLevel = useCallback((existingStatistics: DataSourceItem[] = []) => {
    if (existingStatistics.length === 0) return 0;
    const maxLevel = Math.max(...existingStatistics.map(stat => stat.level || 0));
    return maxLevel + 1;
  }, []);

  const calculateCurrentLevel = useCallback(() => {
    return getNextLevel(currentLayerStatistics);
  }, [getNextLevel, currentLayerStatistics]);

  return {
    isStatisticsLayer,
    setIsStatisticsLayer,
    statisticsLevel: calculateCurrentLevel(),
    getNextLevel,
    calculateCurrentLevel
  };
};
