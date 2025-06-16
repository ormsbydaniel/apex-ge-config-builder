
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { DataSource, isDataSourceItemArray } from '@/types/config';
import UrlDisplay from '@/components/ui/url-display';

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
  const hasDataSources = isDataSourceItemArray(source.data) && source.data.length > 0;
  const hasStatisticsSources = source.statistics && source.statistics.length > 0;

  return (
    <div className="space-y-4">
      {/* Data Sources Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-slate-700 text-sm">Data Sources</h4>
          {onAddDataSource && (
            <Button variant="outline" size="sm" onClick={onAddDataSource} className="text-xs">
              <Plus className="h-3 w-3 mr-1" />
              Add Data Source
            </Button>
          )}
        </div>

        {hasDataSources ? (
          <div className="space-y-2">
            {source.data.map((dataItem, dataIndex) => (
              <div key={dataIndex} className="flex items-center justify-between p-3 rounded-lg bg-teal-100">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {dataItem.format.toUpperCase()}
                  </Badge>
                  <UrlDisplay
                    url={dataItem.url}
                    format={dataItem.format}
                    className="flex-1 min-w-0"
                  />
                  {dataItem.layers && (
                    <span className="text-xs text-blue-600 flex-shrink-0">• {dataItem.layers}</span>
                  )}
                  {dataItem.isBaseLayer && (
                    <Badge variant="secondary" className="text-xs flex-shrink-0">Base Layer</Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveDataSource(dataIndex)}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700 flex-shrink-0"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg text-center">
            No data sources configured
          </div>
        )}
      </div>

      {/* Statistics Sources Section */}
      {hasStatisticsSources && (
        <div>
          <h4 className="font-medium text-slate-700 mb-3 text-sm">Statistics Sources</h4>
          <div className="space-y-2">
            {source.statistics.map((statsItem, statsIndex) => (
              <div key={statsIndex} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 flex-shrink-0">
                    {statsItem.format.toUpperCase()}
                  </Badge>
                  <Badge variant="secondary" className="text-xs flex-shrink-0">
                    Level {statsItem.level ?? 0}
                  </Badge>
                  <UrlDisplay
                    url={statsItem.url}
                    format={statsItem.format}
                    className="flex-1 min-w-0"
                  />
                  {statsItem.layers && (
                    <span className="text-xs text-blue-600 flex-shrink-0">• {statsItem.layers}</span>
                  )}
                </div>
                {onRemoveStatisticsSource && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveStatisticsSource(statsIndex)}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700 flex-shrink-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataSourceDisplay;
