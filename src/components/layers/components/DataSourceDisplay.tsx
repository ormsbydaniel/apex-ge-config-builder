import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { DataSource, isDataSourceItemArray, Service, DataSourceMeta, DataSourceLayout } from '@/types/config';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import DataSourceItem from './DataSourceItem';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem as SelectOption,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DataSourceDisplayProps {
  source: DataSource;
  services?: Service[];
  onAddDataSource?: () => void;
  onRemoveDataSource: (dataSourceIndex: number) => void;
  onRemoveAllDataSources?: () => void;
  onRemoveStatisticsSource?: (statsIndex: number) => void;
  onEditDataSource?: (dataIndex: number) => void;
  onEditStatisticsSource?: (statsIndex: number) => void;
  onUpdateMeta?: (updates: Partial<DataSourceMeta>) => void;
  onUpdateLayout?: (updates: Partial<DataSourceLayout>) => void;
  showStatsLevelForData?: boolean;
}

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

const DataSourceDisplay = ({
  source,
  services = [],
  onAddDataSource,
  onRemoveDataSource,
  onRemoveAllDataSources,
  onRemoveStatisticsSource,
  onEditDataSource,
  onEditStatisticsSource,
  onUpdateMeta,
  onUpdateLayout,
  showStatsLevelForData = false
}: DataSourceDisplayProps) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const isSwipeLayer = (source as any).isSwipeLayer === true || source.meta?.swipeConfig !== undefined;
  const timeframe = source.timeframe;
  const hasDataSources = source.data && isDataSourceItemArray(source.data) && source.data.length > 0;
  const hasStatistics = source.statistics && source.statistics.length > 0;

  const totalItems = hasDataSources ? source.data.length : 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const needsPagination = totalItems > itemsPerPage;

  // Reset to page 0 when data length or page size changes
  useEffect(() => {
    setCurrentPage(0);
  }, [totalItems, itemsPerPage]);

  const pagedData = hasDataSources
    ? source.data.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)
    : [];

  const startItem = currentPage * itemsPerPage + 1;
  const endItem = Math.min((currentPage + 1) * itemsPerPage, totalItems);

  // Generate page numbers to display (max 5 visible)
  const getVisiblePages = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i);
    const pages: (number | 'ellipsis')[] = [];
    pages.push(0);
    if (currentPage > 2) pages.push('ellipsis');
    const start = Math.max(1, currentPage - 1);
    const end = Math.min(totalPages - 2, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 3) pages.push('ellipsis');
    pages.push(totalPages - 1);
    return pages;
  };

  return <div className="space-y-4">
      {/* Datasets Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {needsPagination && (
              <span className="text-xs text-muted-foreground">
                Showing {startItem}–{endItem} of {totalItems}
              </span>
            )}
            {needsPagination && (
              <>
                <Select value={String(itemsPerPage)} onValueChange={(val) => setItemsPerPage(Number(val))}>
                  <SelectTrigger className="h-7 w-[70px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map(size => (
                      <SelectOption key={size} value={String(size)}>{size}</SelectOption>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground">items per page</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onAddDataSource && <Button variant="outline" size="sm" onClick={onAddDataSource} className="text-primary hover:bg-primary/10 border-primary/30">
                <Plus className="h-3 w-3 mr-1" />
                Add Dataset
              </Button>}
            {hasDataSources && onRemoveAllDataSources && (
              <AlertDialog>
                <TooltipProvider>
                  <Tooltip>
                    <AlertDialogTrigger asChild>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-0.5 mr-[-4px]">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                          <span className="text-xs text-destructive">All</span>
                        </div>
                      </TooltipTrigger>
                    </AlertDialogTrigger>
                    <TooltipContent>Remove all data sources</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove all data sources?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Remove all {totalItems} data sources from this layer. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onRemoveAllDataSources}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Remove all {totalItems} data sources
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {hasDataSources ? <div className="space-y-2">
            {pagedData.map((dataItem, index) => {
              const absoluteIndex = currentPage * itemsPerPage + index;
              return <DataSourceItem
                key={absoluteIndex}
                dataSource={dataItem}
                index={absoluteIndex}
                onRemove={onRemoveDataSource}
                onEdit={onEditDataSource}
                showPosition={isSwipeLayer}
                showStatsLevel={showStatsLevelForData}
                timeframe={timeframe}
                services={services}
                currentMeta={source.meta}
                currentLayout={source.layout}
                sourceName={source.name}
                onUpdateMeta={onUpdateMeta}
                onUpdateLayout={onUpdateLayout}
              />;
            })}

            {needsPagination && (
              <Pagination className="mt-3 [&_a]:text-xs [&_a]:h-7 [&_a]:min-w-7">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                      className={currentPage === 0 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {getVisiblePages().map((page, i) => (
                    <PaginationItem key={i}>
                      {page === 'ellipsis' ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          isActive={page === currentPage}
                          onClick={() => setCurrentPage(page)}
                          className="cursor-pointer"
                        >
                          {page + 1}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                      className={currentPage === totalPages - 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div> : <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-md border border-dashed">
            <p className="text-sm">No datasets added yet.</p>
            {onAddDataSource && <p className="text-xs mt-1">Click "Add Dataset" to get started.</p>}
          </div>}
      </div>

      {/* Statistics Section */}
      {hasStatistics && <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Statistics Sources</h4>
          <div className="space-y-2">
            {source.statistics.map((stat, index) => <DataSourceItem key={index} dataSource={stat} index={index} onRemove={onRemoveStatisticsSource || (() => {})} onEdit={onEditStatisticsSource} showPosition={isSwipeLayer} showStatsLevel={true} timeframe={timeframe} services={services} />)}
          </div>
        </div>}
    </div>;
};
export default DataSourceDisplay;
