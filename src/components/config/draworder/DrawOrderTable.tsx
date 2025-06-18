
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DataSourceRow } from '@/hooks/useDrawOrderData';
import SortButton from './SortButton';

type SortField = 'zIndex' | 'url' | 'layerName' | 'interfaceGroup' | 'sourceType';
type SortDirection = 'asc' | 'desc';

interface DrawOrderTableProps {
  sortedRows: DataSourceRow[];
  selectedRows: Set<string>;
  sortField: SortField;
  sortDirection: SortDirection;
  isAllSelected: boolean;
  isPartiallySelected: boolean;
  onSort: (field: SortField) => void;
  onSelectAll: (checked: boolean) => void;
  onRowSelection: (rowKey: string, checked: boolean) => void;
  onUpdateZLevel: (rowKey: string, newZLevel: number) => void;
  getRowKey: (row: DataSourceRow) => string;
}

const DrawOrderTable = ({
  sortedRows,
  selectedRows,
  sortField,
  sortDirection,
  isAllSelected,
  isPartiallySelected,
  onSort,
  onSelectAll,
  onRowSelection,
  onUpdateZLevel,
  getRowKey
}: DrawOrderTableProps) => {
  const [editingZLevel, setEditingZLevel] = useState<string | null>(null);
  const [tempZValue, setTempZValue] = useState<string>('');

  const handleZLevelClick = (rowKey: string, currentZLevel: number) => {
    setEditingZLevel(rowKey);
    setTempZValue(currentZLevel.toString());
  };

  const handleZLevelSubmit = (rowKey: string) => {
    const newZLevel = parseInt(tempZValue, 10);
    if (!isNaN(newZLevel) && newZLevel >= 0) {
      onUpdateZLevel(rowKey, newZLevel);
    }
    setEditingZLevel(null);
    setTempZValue('');
  };

  const handleZLevelKeyPress = (e: React.KeyboardEvent, rowKey: string) => {
    if (e.key === 'Enter') {
      handleZLevelSubmit(rowKey);
    } else if (e.key === 'Escape') {
      setEditingZLevel(null);
      setTempZValue('');
    }
  };

  return (
    <TooltipProvider>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={onSelectAll}
                className={isPartiallySelected ? "data-[state=checked]:bg-primary/50" : ""}
              />
            </TableHead>
            <TableHead className="w-[100px]">
              <SortButton 
                field="zIndex" 
                currentSortField={sortField}
                currentSortDirection={sortDirection}
                onSort={onSort}
              >
                Z Level
              </SortButton>
            </TableHead>
            <TableHead className="w-[120px]">
              <SortButton 
                field="sourceType" 
                currentSortField={sortField}
                currentSortDirection={sortDirection}
                onSort={onSort}
              >
                Source Type
              </SortButton>
            </TableHead>
            <TableHead>
              <SortButton 
                field="interfaceGroup" 
                currentSortField={sortField}
                currentSortDirection={sortDirection}
                onSort={onSort}
              >
                Interface Group
              </SortButton>
            </TableHead>
            <TableHead>
              <SortButton 
                field="layerName" 
                currentSortField={sortField}
                currentSortDirection={sortDirection}
                onSort={onSort}
              >
                Layer Name
              </SortButton>
            </TableHead>
            <TableHead>
              <SortButton 
                field="url" 
                currentSortField={sortField}
                currentSortDirection={sortDirection}
                onSort={onSort}
              >
                Data Source
              </SortButton>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRows.map((row) => {
            const rowKey = getRowKey(row);
            const truncatedUrl = row.url.length > 50 ? `${row.url.substring(0, 50)}...` : row.url;
            const isUrlTruncated = row.url.length > 50;
            const isEditingThisRow = editingZLevel === rowKey;
            
            return (
              <TableRow key={rowKey}>
                <TableCell>
                  <Checkbox
                    checked={selectedRows.has(rowKey)}
                    onCheckedChange={(checked) => onRowSelection(rowKey, checked === true)}
                  />
                </TableCell>
                <TableCell className="font-mono">
                  {isEditingThisRow ? (
                    <Input
                      type="number"
                      value={tempZValue}
                      onChange={(e) => setTempZValue(e.target.value)}
                      onBlur={() => handleZLevelSubmit(rowKey)}
                      onKeyDown={(e) => handleZLevelKeyPress(e, rowKey)}
                      className="w-20 h-8"
                      autoFocus
                    />
                  ) : (
                    <span 
                      className="cursor-pointer hover:bg-muted px-2 py-1 rounded"
                      onClick={() => handleZLevelClick(rowKey, row.zIndex)}
                    >
                      {row.zIndex}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={row.sourceType === 'data' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {row.sourceType === 'data' ? 'Data' : 'Statistics'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs ${
                    row.isBaseLayer 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {row.interfaceGroup}
                  </span>
                </TableCell>
                <TableCell>
                  {row.layerName}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {isUrlTruncated ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help">{truncatedUrl}</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs break-all">{row.url}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <span>{row.url}</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TooltipProvider>
  );
};

export default DrawOrderTable;
