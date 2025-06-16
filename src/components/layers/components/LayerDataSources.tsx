
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { DataSourceItem } from '@/types/config';

interface LayerDataSourcesProps {
  dataSources: DataSourceItem[];
}

const LayerDataSources = ({ dataSources }: LayerDataSourcesProps) => {
  return (
    <div className="mt-3">
      <span className="text-sm font-medium text-slate-600">Data Sources:</span>
      <div className="mt-1 space-y-1">
        {dataSources.map((dataItem, dataIndex) => (
          <div key={dataIndex} className="text-xs text-slate-500 bg-slate-50 p-2 rounded">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {dataItem.format.toUpperCase()}
              </Badge>
              <span className="truncate">{dataItem.url}</span>
              {dataItem.layers && (
                <span className="text-blue-600">• {dataItem.layers}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LayerDataSources;
