
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DataSource, isDataSourceItemArray } from '@/types/config';
import DataSourceItem from './DataSourceItem';

interface DataSourceDisplayProps {
  source: DataSource;
  onAddDataSource?: () => void;
  onRemoveDataSource: (dataSourceIndex: number) => void;
  onRemoveStatisticsSource?: (statsIndex: number) => void;
  onEditDataSource?: (dataIndex: number) => void;
  onEditStatisticsSource?: (statsIndex: number) => void;
}

const DataSourceDisplay = ({
  source,
  onAddDataSource,
  onRemoveDataSource,
  onRemoveStatisticsSource,
  onEditDataSource,
  onEditStatisticsSource
}: DataSourceDisplayProps) => {
  // Determine if this is a comparison layer that needs position display
  const isComparisonLayer = source.meta?.swipeConfig !== undefined || 
                           (source as any).isMirrorLayer || 
                           (source as any).isSpotlightLayer;

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
                showPosition={isComparisonLayer}
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
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-md bg-blue-50">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    STATS
                  </span>
                  <span className="text-sm font-medium truncate flex-1">
                    {stat.name || 'Statistics Layer'}
                  </span>
                  <span className="text-xs text-gray-500">
                    Level: {stat.level || 'default'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {onEditStatisticsSource && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEditStatisticsSource(index)}
                      className="h-8 w-8 p-0"
                      title="Edit Statistics"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  )}
                  {onRemoveStatisticsSource && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRemoveStatisticsSource(index)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      title="Remove Statistics"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataSourceDisplay;
