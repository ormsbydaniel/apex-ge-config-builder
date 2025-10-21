import { DataSource, Service } from '@/types/config';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import DataSourceDisplay from './DataSourceDisplay';

interface DataSourcesTabProps {
  source: DataSource;
  services: Service[];
  layerIndex: number;
  onAdd: (layerIndex: number) => void;
  onRemove: (layerIndex: number, dataIndex: number) => void;
  onEdit: (layerIndex: number, dataIndex: number) => void;
}

export function DataSourcesTab({
  source,
  services,
  layerIndex,
  onAdd,
  onRemove,
  onEdit,
}: DataSourcesTabProps) {
  const hasDataSources = source.data && source.data.length > 0;

  // Create a wrapped source that only contains data (not statistics)
  const dataOnlySource = {
    ...source,
    statistics: [] // Empty statistics to prevent them showing in data tab
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Data Sources</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAdd(layerIndex)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Data Source
        </Button>
      </div>

      {hasDataSources ? (
        <DataSourceDisplay
          source={dataOnlySource}
          services={services}
          onRemoveDataSource={(dataIndex) => onRemove(layerIndex, dataIndex)}
          onEditDataSource={(dataIndex) => onEdit(layerIndex, dataIndex)}
        />
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-muted/50 p-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            No data sources configured yet
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAdd(layerIndex)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Your First Data Source
          </Button>
        </div>
      )}
    </div>
  );
}
