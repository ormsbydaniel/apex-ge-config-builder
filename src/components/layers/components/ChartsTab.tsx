import { DataSource, Service } from '@/types/config';
import { ChartConfig } from '@/types/chart';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, BarChart3 } from 'lucide-react';

interface ChartsTabProps {
  source: DataSource;
  services: Service[];
  layerIndex: number;
  onAdd: (layerIndex: number) => void;
  onRemove: (layerIndex: number, chartIndex: number) => void;
  onEdit: (layerIndex: number, chartIndex: number) => void;
}

export function ChartsTab({
  source,
  services,
  layerIndex,
  onAdd,
  onRemove,
  onEdit
}: ChartsTabProps) {
  const charts = source.charts || [];
  const hasCharts = charts.length > 0;

  return (
    <div className="space-y-4">
      {hasCharts ? (
        <div className="space-y-2">
          {charts.map((chart, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {chart.title || `Chart ${index + 1}`}
                  </p>
                  {chart.sources && chart.sources.length > 0 && (
                    <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                      {chart.sources[0].url || 'No URL configured'}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(layerIndex, index)}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(layerIndex, index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-muted/50 p-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            No charts configured yet
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Charts can display data from CSV sources using Plotly
          </p>
        </div>
      )}

      <div className="flex items-center justify-end pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAdd(layerIndex)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Chart
        </Button>
      </div>
    </div>
  );
}
