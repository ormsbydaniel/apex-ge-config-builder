import { DataSource, Service, DataSourceMeta, DataSourceLayout } from '@/types/config';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import DataSourceDisplay from './DataSourceDisplay';
import { useLayersTabContext } from '@/contexts/LayersTabContext';
interface DataSourcesTabProps {
  source: DataSource;
  services: Service[];
  layerIndex: number;
  onAdd: (layerIndex: number) => void;
  onRemove: (layerIndex: number, dataIndex: number) => void;
  onEdit: (layerIndex: number, dataIndex: number) => void;
  onUpdateMeta?: (updates: Partial<DataSourceMeta>) => void;
  onUpdateLayout?: (updates: Partial<DataSourceLayout>) => void;
}
export function DataSourcesTab({
  source,
  services,
  layerIndex,
  onAdd,
  onRemove,
  onEdit,
  onUpdateMeta,
  onUpdateLayout,
}: DataSourcesTabProps) {
  const { onRemoveAllDataSources } = useLayersTabContext();
  const hasDataSources = source.data && source.data.length > 0;

  // Create a wrapped source that only contains data (not statistics)
  const dataOnlySource = {
    ...source,
    statistics: [] // Empty statistics to prevent them showing in data tab
  };
  return <div className="space-y-4">
      {hasDataSources ? <DataSourceDisplay source={dataOnlySource} services={services} onRemoveDataSource={dataIndex => onRemove(layerIndex, dataIndex)} onRemoveAllDataSources={() => onRemoveAllDataSources(layerIndex)} onEditDataSource={dataIndex => onEdit(layerIndex, dataIndex)} onUpdateMeta={onUpdateMeta} onUpdateLayout={onUpdateLayout} /> : <div className="rounded-lg border border-dashed border-border bg-muted/50 p-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            No datasets configured yet
          </p>
        </div>}

      <div className="flex items-center justify-end pt-2">
        <Button variant="outline" size="sm" onClick={() => onAdd(layerIndex)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Dataset
        </Button>
      </div>
    </div>;
}