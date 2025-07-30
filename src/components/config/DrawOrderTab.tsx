
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpDown } from 'lucide-react';
import { DataSource } from '@/types/config';
import { useDrawOrderData } from '@/hooks/useDrawOrderData';
import { useTableSelection } from '@/hooks/useTableSelection';
import { useDrawOrderActions } from '@/hooks/useDrawOrderActions';
import { useTableSorting } from '@/hooks/useTableSorting';
import BatchActionsPanel from './draworder/BatchActionsPanel';
import DrawOrderTable from './draworder/DrawOrderTable';

interface DrawOrderTabProps {
  config: {
    sources: DataSource[];
    exclusivitySets: string[];
  };
  updateConfig: (updates: { sources?: DataSource[] }) => void;
}

type SortField = 'zIndex' | 'url' | 'layerName' | 'interfaceGroup' | 'sourceType';

const DrawOrderTab = ({ config, updateConfig }: DrawOrderTabProps) => {
  const [isMoreDialogOpen, setIsMoreDialogOpen] = useState(false);

  // Extract data processing logic
  const { dataRows, minZLevel, maxZLevel } = useDrawOrderData({
    sources: config.sources
  });

  // Handle sorting
  const { sortedData: sortedRows, sortField, sortDirection, handleSort } = useTableSorting({
    data: dataRows,
    defaultSortField: 'zIndex' as SortField,
    defaultSortDirection: 'asc'
  });

  // Handle selection
  const getRowKey = (row: typeof dataRows[0]) => `${row.sourceIndex}-${row.sourceType}-${row.dataIndex}`;
  
  const {
    selectedItems: selectedRows,
    handleItemSelection: handleRowSelection,
    handleSelectAll,
    isAllSelected,
    isPartiallySelected
  } = useTableSelection({
    items: sortedRows,
    getItemKey: getRowKey
  });

  // Handle Z-level actions
  const {
    updateZLevel,
    adjustSelectedZLevels,
    setSelectedZLevels,
    multiplySelectedZLevels
  } = useDrawOrderActions({
    config,
    updateConfig
  });

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5" />
            Draw Order Configuration
          </CardTitle>
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
                onAdjustZLevels={(adjustment) => adjustSelectedZLevels(selectedRows, adjustment)}
                onSetZLevels={(zLevel) => setSelectedZLevels(selectedRows, zLevel)}
                onMultiplyZLevels={(multiplier) => multiplySelectedZLevels(selectedRows, multiplier)}
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
