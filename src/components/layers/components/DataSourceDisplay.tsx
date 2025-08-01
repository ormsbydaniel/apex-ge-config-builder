
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DataSource, isDataSourceItemArray, Service } from '@/types/config';
import DataSourceItem from './DataSourceItem';

interface DataSourceDisplayProps {
  source: DataSource;
  services?: Service[];
  onAddDataSource?: () => void;
  onRemoveDataSource: (dataSourceIndex: number) => void;
  onRemoveStatisticsSource?: (statsIndex: number) => void;
  onEditDataSource?: (dataIndex: number) => void;
  onEditStatisticsSource?: (statsIndex: number) => void;
}

const DataSourceDisplay = ({
  source,
  services = [],
  onAddDataSource,
  onRemoveDataSource,
  onRemoveStatisticsSource,
  onEditDataSource,
  onEditStatisticsSource
}: DataSourceDisplayProps) => {
  // Check if this is a swipe layer that needs position display
  const isSwipeLayer = (source as any).isSwipeLayer === true || source.meta?.swipeConfig !== undefined;
  // Get timeframe for temporal display
  const timeframe = source.timeframe;

  const hasDataSources = source.data && isDataSourceItemArray(source.data) && source.data.length > 0;
  const hasStatistics = source.statistics && source.statistics.length > 0;

  return (
    <div className="space-y-4">
      {/* Data Sources Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700">Data Sources</h4>
          {onAddDataSource && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAddDataSource}
              className="text-primary hover:bg-primary/10 border-primary/30"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Data Source
            </Button>
          )}
        </div>

        {hasDataSources ? (
          <div className="space-y-2">
            {source.data.map((dataItem, index) => (
              <DataSourceItem
                key={index}
                dataSource={dataItem}
                index={index}
                onRemove={onRemoveDataSource}
                showPosition={isSwipeLayer}
                timeframe={timeframe}
                services={services}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-md border border-dashed">
            <p className="text-sm">No data sources added yet.</p>
            {onAddDataSource && (
              <p className="text-xs mt-1">Click "Add Data Source" to get started.</p>
            )}
          </div>
        )}
      </div>

      {/* Statistics Section */}
      {hasStatistics && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Statistics Sources</h4>
          <div className="space-y-2">
            {source.statistics.map((stat, index) => (
              <DataSourceItem
                key={index}
                dataSource={stat}
                index={index}
                onRemove={onRemoveStatisticsSource || (() => {})}
                showPosition={isSwipeLayer}
                showStatsLevel={true}
                timeframe={timeframe}
                services={services}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataSourceDisplay;
