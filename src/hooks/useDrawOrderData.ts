
import { useMemo } from 'react';
import { DataSource, isDataSourceItemArray } from '@/types/config';

export interface DataSourceRow {
  sourceIndex: number;
  dataIndex: number;
  sourceType: 'data' | 'statistics';
  zIndex: number;
  url: string;
  layerName: string;
  interfaceGroup: string;
  isBaseLayer: boolean;
}

interface UseDrawOrderDataProps {
  sources: DataSource[];
}

export const useDrawOrderData = ({ sources }: UseDrawOrderDataProps) => {
  const dataRows = useMemo(() => {
    const rows: DataSourceRow[] = [];
    
    sources.forEach((source, sourceIndex) => {
      // Process data sources
      if (isDataSourceItemArray(source.data)) {
        source.data.forEach((dataItem, dataIndex) => {
          rows.push({
            sourceIndex,
            dataIndex,
            sourceType: 'data',
            zIndex: dataItem.zIndex,
            url: dataItem.url || 'N/A',
            layerName: source.name,
            interfaceGroup: dataItem.isBaseLayer ? 'Base Layer' : (source.layout?.interfaceGroup || 'Ungrouped'),
            isBaseLayer: dataItem.isBaseLayer || false
          });
        });
      }

      // Process statistics sources
      if (source.statistics) {
        source.statistics.forEach((statsItem, statsIndex) => {
          rows.push({
            sourceIndex,
            dataIndex: statsIndex,
            sourceType: 'statistics',
            zIndex: statsItem.zIndex,
            url: statsItem.url || 'N/A',
            layerName: source.name,
            interfaceGroup: source.layout?.interfaceGroup || 'Ungrouped',
            isBaseLayer: false
          });
        });
      }
    });

    return rows;
  }, [sources]);

  // Get min and max Z levels for actions
  const zLevels = dataRows.map(row => row.zIndex);
  const minZLevel = zLevels.length > 0 ? Math.min(...zLevels) : 0;
  const maxZLevel = zLevels.length > 0 ? Math.max(...zLevels) : 0;

  return {
    dataRows,
    minZLevel,
    maxZLevel
  };
};
