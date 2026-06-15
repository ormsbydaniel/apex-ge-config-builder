import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Pencil,
  Copy,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  FileJson,
  Server,
} from 'lucide-react';
import { WorkflowItem } from '@/types/dataSource';
import { DataSource, DataSourceItem, isDataSourceItemArray } from '@/types/config';
import { DataSourceMeta, DataSourceLayout } from '@/types/layer';
import { isVectorFormat } from '@/utils/fieldDetection';
import LayerDescriptionAttributionDisplay from '@/components/layers/components/LayerDescriptionAttributionDisplay';
import LayerDataVisualisationSection from '@/components/layers/components/LayerDataVisualisationSection';
import LayerLegendSection from '@/components/layers/components/LayerLegendSection';
import LayerFieldsDisplay from '@/components/layers/components/LayerFieldsDisplay';
import LayerControlsDisplay from '@/components/layers/components/LayerControlsDisplay';

interface WorkflowCardProps {
  workflow: WorkflowItem;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onEditJson: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onUpdate: (workflow: WorkflowItem) => void;
}

/**
 * Adapt a WorkflowItem into a DataSource-shaped object so the shared Layer*
 * display components can render it. The synthetic `name`/`isActive` fields
 * are only for the children; we never write them back to the workflow.
 */
const toSourceAdapter = (wf: WorkflowItem): DataSource => ({
  ...(wf as any),
  name: wf.serviceId ?? '',
  isActive: true,
  data: (wf as any).data ?? [],
} as DataSource);

export const WorkflowCard = ({
  workflow,
  isFirst,
  isLast,
  onEdit,
  onEditJson,
  onDuplicate,
  onRemove,
  onMoveUp,
  onMoveDown,
  onUpdate,
}: WorkflowCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);

  const title = workflow.serviceId || '(unnamed workflow)';
  const provider = workflow.serviceProvider;
  const description = workflow.meta?.description;

  // Strip synthetic adapter fields before persisting.
  const persist = (next: DataSource) => {
    const { name: _n, isActive: _a, ...rest } = next as any;
    onUpdate({
      ...(workflow as any),
      ...rest,
    } as WorkflowItem);
  };

  const handleUpdateMeta = (updates: Partial<DataSourceMeta>) => {
    onUpdate({
      ...(workflow as any),
      meta: { ...(workflow.meta ?? {}), ...updates },
    } as WorkflowItem);
  };

  const handleUpdateLayout = (updates: Partial<DataSourceLayout>) => {
    onUpdate({
      ...(workflow as any),
      layout: { ...((workflow as any).layout ?? {}), ...updates },
    } as WorkflowItem);
  };

  const handleUpdateLayoutAndMeta = (
    layoutUpdates: Partial<DataSourceLayout>,
    metaUpdates: Partial<DataSourceMeta>,
  ) => {
    onUpdate({
      ...(workflow as any),
      layout: { ...((workflow as any).layout ?? {}), ...layoutUpdates },
      meta: { ...(workflow.meta ?? {}), ...metaUpdates },
    } as WorkflowItem);
  };

  const handleUpdateData = (data: DataSourceItem[]) => {
    onUpdate({ ...(workflow as any), data } as WorkflowItem);
  };

  const handleControlsSave = (
    layoutUpdates: Partial<DataSourceLayout>,
    sourceFieldUpdates: Record<string, any>,
  ) => {
    onUpdate({
      ...(workflow as any),
      ...sourceFieldUpdates,
      layout: { ...((workflow as any).layout ?? {}), ...layoutUpdates },
    } as WorkflowItem);
  };

  // Service details inline edit state
  const updateServiceDetails = (
    patch: Partial<NonNullable<WorkflowItem['serviceDetails']>>,
  ) => {
    const current = workflow.serviceDetails ?? { endpoint: '' };
    const merged = { ...current, ...patch };
    const cleaned: any = { endpoint: merged.endpoint ?? '' };
    if (merged.namespace) cleaned.namespace = merged.namespace;
    if (merged.application) cleaned.application = merged.application;
    onUpdate({ ...(workflow as any), serviceDetails: cleaned } as WorkflowItem);
  };

  const adapter = toSourceAdapter(workflow);
  const firstVectorSource = isDataSourceItemArray(adapter.data)
    ? adapter.data.find((d) => d.format && isVectorFormat(d.format))
    : undefined;

  return (
    <Card className="border-border">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className="flex flex-col gap-1 pt-0.5">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={onMoveUp}
              disabled={isFirst}
              aria-label="Move up"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={onMoveDown}
              disabled={isLast}
              aria-label="Move down"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 shrink-0"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? 'Collapse workflow' : 'Expand workflow'}
          >
            <ChevronRight
              className={`h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
            />
          </Button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-medium text-sm truncate">{title}</h3>
              {provider && (
                <Badge variant="secondary" className="text-xs font-normal">
                  {provider}
                </Badge>
              )}
              {workflow.serviceDetails?.endpoint && (
                <Badge variant="outline" className="text-xs font-normal">
                  {workflow.serviceDetails.endpoint.replace(/^https?:\/\//, '').split('/')[0]}
                </Badge>
              )}
            </div>
            {description && !expanded && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{description}</p>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={onEdit}
              aria-label="Edit workflow"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={onEditJson}
              aria-label="Edit workflow JSON"
              title="Edit JSON"
            >
              <FileJson className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={onDuplicate}
              aria-label="Duplicate workflow"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={onRemove}
              aria-label="Remove workflow"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="space-y-4 mt-4 pl-[46px]">
            {/* Service details (workflow-specific) */}
            <Collapsible open={serviceOpen} onOpenChange={setServiceOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="px-1 -ml-1 h-7"
                >
                  <ChevronRight
                    className={`h-4 w-4 mr-1 transition-transform ${serviceOpen ? 'rotate-90' : ''}`}
                  />
                  <Server className="h-4 w-4 mr-2 text-muted-foreground" />
                  Service details
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-2 pl-6">
                <div className="space-y-1.5">
                  <Label htmlFor={`wf-endpoint-${workflow.serviceId}`}>Endpoint</Label>
                  <Input
                    id={`wf-endpoint-${workflow.serviceId}`}
                    value={workflow.serviceDetails?.endpoint ?? ''}
                    onChange={(e) => updateServiceDetails({ endpoint: e.target.value })}
                    placeholder="https://…"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`wf-namespace-${workflow.serviceId}`}>Namespace</Label>
                  <Input
                    id={`wf-namespace-${workflow.serviceId}`}
                    value={workflow.serviceDetails?.namespace ?? ''}
                    onChange={(e) => updateServiceDetails({ namespace: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`wf-application-${workflow.serviceId}`}>Application</Label>
                  <Input
                    id={`wf-application-${workflow.serviceId}`}
                    value={workflow.serviceDetails?.application ?? ''}
                    onChange={(e) => updateServiceDetails({ application: e.target.value })}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Shared layer sections */}
            <LayerDescriptionAttributionDisplay
              source={adapter}
              onUpdateMeta={handleUpdateMeta}
            />

            <LayerDataVisualisationSection
              source={adapter}
              onUpdateMeta={handleUpdateMeta}
              onUpdateDataSources={handleUpdateData}
            />

            <LayerLegendSection
              source={adapter}
              onUpdateLayout={handleUpdateLayout}
              onUpdateMeta={handleUpdateMeta}
              onUpdateLayoutAndMeta={handleUpdateLayoutAndMeta}
            />

            {firstVectorSource && (
              <LayerFieldsDisplay
                fields={workflow.meta?.fields || {}}
                onUpdate={(fields) => handleUpdateMeta({ fields })}
                sourceUrl={firstVectorSource.url}
                sourceFormat={firstVectorSource.format}
              />
            )}

            <LayerControlsDisplay source={adapter} onSave={handleControlsSave} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkflowCard;
