
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataSource, isDataSourceItemArray } from '@/types/config';
import BatchActionsPanel from './draworder/BatchActionsPanel';
import DrawOrderTable from './draworder/DrawOrderTable';

interface DrawOrderTabProps {
  config: {
    sources: DataSource[];
    exclusivitySets: string[];
  };
  updateConfig: (updates: { sources?: DataSource[] }) => void;
}

interface DataSourceRow {
  sourceIndex: number;
  dataIndex: number;
  sourceType: 'data' | 'statistics';
  zIndex: number;
  url: string;
  layerName: string;
  interfaceGroup: string;
  isBaseLayer: boolean;
}

type SortField = 'zIndex' | 'url' | 'layerName' | 'interfaceGroup' | 'sourceType';
type SortDirection = 'asc' | 'desc';

const DrawOrderTab = ({ config, updateConfig }: DrawOrderTabProps) => {
  const [sortField, setSortField] = useState<SortField>('zIndex');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [isMoreDialogOpen, setIsMoreDialogOpen] = useState(false);

  // Extract all data sources and statistics sources with their metadata
  const dataRows = useMemo(() => {
    const rows: DataSourceRow[] = [];
    
    config.sources.forEach((source, sourceIndex) => {
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
  }, [config.sources]);

  // Sort the data rows
  const sortedRows = useMemo(() => {
    return [...dataRows].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
      }
      if (typeof bValue === 'string') {
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [dataRows, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getRowKey = (row: DataSourceRow) => `${row.sourceIndex}-${row.sourceType}-${row.dataIndex}`;

  const handleRowSelection = (rowKey: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(rowKey);
    } else {
      newSelected.delete(rowKey);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allKeys = new Set(sortedRows.map(getRowKey));
      setSelectedRows(allKeys);
    } else {
      setSelectedRows(new Set());
    }
  };

  const adjustSelectedZLevels = (adjustment: number) => {
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
  };

  const setSelectedZLevels = (zLevel: number) => {
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
  };

  const multiplySelectedZLevels = (multiplier: number) => {
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
  };

  const updateZLevel = (rowKey: string, newZLevel: number) => {
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
  };

  // Get min and max Z levels for draw first/last actions
  const zLevels = dataRows.map(row => row.zIndex);
  const minZLevel = zLevels.length > 0 ? Math.min(...zLevels) : 0;
  const maxZLevel = zLevels.length > 0 ? Math.max(...zLevels) : 0;

  const isAllSelected = sortedRows.length > 0 && selectedRows.size === sortedRows.length;
  const isPartiallySelected = selectedRows.size > 0 && selectedRows.size < sortedRows.length;

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-primary">Draw Order Configuration</CardTitle>
          <CardDescription>
              Data is drawn on the map in "Z" level order with the lowest numbers drawn first and higher numbers drawn on top and appearing in front. A continuous sequence (0, 1, 2, 3 etc) is not necessary and sequences with gaps (e.g. 5, 10, 20, 21, 22, 50) is fine and allows other layers to be added in the middle of the drawing sequence.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedRows.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No data sources configured yet.
            </div>
          ) : (
            <>
              <BatchActionsPanel
                selectedCount={selectedRows.size}
                onAdjustZLevels={adjustSelectedZLevels}
                onSetZLevels={setSelectedZLevels}
                onMultiplyZLevels={multiplySelectedZLevels}
                minZLevel={minZLevel}
                maxZLevel={maxZLevel}
                isMoreDialogOpen={isMoreDialogOpen}
                setIsMoreDialogOpen={setIsMoreDialogOpen}
              />

              <DrawOrderTable
                sortedRows={sortedRows}
                selectedRows={selectedRows}
                sortField={sortField}
                sortDirection={sortDirection}
                isAllSelected={isAllSelected}
                isPartiallySelected={isPartiallySelected}
                onSort={handleSort}
                onSelectAll={handleSelectAll}
                onRowSelection={handleRowSelection}
                onUpdateZLevel={updateZLevel}
                getRowKey={getRowKey}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DrawOrderTab;
