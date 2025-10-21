import { DataSource, Service } from '@/types/config';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import DataSourceDisplay from './DataSourceDisplay';
interface StatisticsSourcesTabProps {
  source: DataSource;
  services: Service[];
  layerIndex: number;
  onAdd: (layerIndex: number) => void;
  onRemove: (layerIndex: number, statsIndex: number) => void;
  onEdit: (layerIndex: number, statsIndex: number) => void;
}
export function StatisticsSourcesTab({
  source,
  services,
  layerIndex,
  onAdd,
  onRemove,
  onEdit
}: StatisticsSourcesTabProps) {
  const hasStatistics = source.statistics && source.statistics.length > 0;

  // Create a wrapped source that only shows statistics in the data field
  const statsOnlySource = {
    ...source,
    data: source.statistics || [],
    statistics: [] // Empty to prevent double-showing
  };
  return <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Sources</h3>
        <Button variant="outline" size="sm" onClick={() => onAdd(layerIndex)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Statistics Source
        </Button>
      </div>

      {hasStatistics ? <DataSourceDisplay source={statsOnlySource} services={services} onRemoveDataSource={statsIndex => onRemove(layerIndex, statsIndex)} onEditDataSource={statsIndex => onEdit(layerIndex, statsIndex)} showStatsLevelForData={true} /> : <div className="rounded-lg border border-dashed border-border bg-muted/50 p-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            No statistics sources configured yet
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Statistics sources can be FlatGeobuf or GeoJSON format
          </p>
          <Button variant="outline" size="sm" onClick={() => onAdd(layerIndex)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Your First Statistics Source
          </Button>
        </div>}
    </div>;
}