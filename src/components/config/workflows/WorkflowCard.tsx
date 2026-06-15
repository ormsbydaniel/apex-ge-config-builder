import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ChevronDown,
  ChevronRight,
  Edit2,
  Check,
  X,
  Server,
  User,
  Pencil,
} from 'lucide-react';

import { WorkflowItem } from '@/types/dataSource';
import {
  DataSource,
  DataSourceItem,
  isDataSourceItemArray,
} from '@/types/config';
import { DataSourceMeta, DataSourceLayout } from '@/types/layer';
import { isVectorFormat } from '@/utils/fieldDetection';
import LayerDescriptionAttributionDisplay from '@/components/layers/components/LayerDescriptionAttributionDisplay';
import LayerDataVisualisationSection from '@/components/layers/components/LayerDataVisualisationSection';
import LayerLegendSection from '@/components/layers/components/LayerLegendSection';
import LayerFieldsDisplay from '@/components/layers/components/LayerFieldsDisplay';
import LayerControlsDisplay from '@/components/layers/components/LayerControlsDisplay';
import LayerMoveControls from '@/components/layers/components/LayerMoveControls';
import CardActionButtons from '@/components/shared/CardActionButtons';

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
  onMoveToTop: () => void;
  onMoveToBottom: () => void;
  onUpdate: (workflow: WorkflowItem) => void;
}

/**
 * Adapt a WorkflowItem into a DataSource-shaped object so the shared Layer*
 * display components can render it.
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
  onMoveToTop,
  onMoveToBottom,
  onUpdate,
}: WorkflowCardProps) => {
  const [expanded, setExpanded] = useState(false);
  
  const [isRenaming, setIsRenaming] = useState(false);
  const [editName, setEditName] = useState(workflow.serviceId ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const title = workflow.serviceId || '(unnamed workflow)';
  const provider = workflow.serviceProvider;

  const handleStartRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditName(workflow.serviceId ?? '');
    setIsRenaming(true);
  };

  const handleConfirmRename = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== workflow.serviceId) {
      onUpdate({ ...(workflow as any), serviceId: trimmed } as WorkflowItem);
    }
    setIsRenaming(false);
  };

  const handleCancelRename = () => {
    setIsRenaming(false);
    setEditName(workflow.serviceId ?? '');
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




  const adapter = toSourceAdapter(workflow);
  const firstVectorSource = isDataSourceItemArray(adapter.data)
    ? adapter.data.find((d) => d.format && isVectorFormat(d.format))
    : undefined;

  const endpointHost = workflow.serviceDetails?.endpoint
    ?.replace(/^https?:\/\//, '')
    .split('/')[0];

  return (
    <Card className="border-l-4 border-l-violet-500">
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CardHeader className="py-3 relative">
          {!isRenaming && (
            <div className="absolute top-[21px] right-2 z-10 flex items-center gap-2">
              {provider && (
                <Badge
                  variant="outline"
                  className="border-violet-300 text-violet-700"
                >
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {provider}
                  </div>
                </Badge>
              )}
              {endpointHost && (
                <Badge
                  variant="outline"
                  className="border-gray-300 text-gray-700"
                >
                  <div className="flex items-center gap-1">
                    <Server className="h-3 w-3" />
                    {endpointHost}
                  </div>
                </Badge>
              )}
              <div className="flex items-center gap-1 justify-end ml-1">
                <div className="h-6 w-px bg-border mr-2"></div>
                <CardActionButtons
                  onEdit={onEdit}
                  onEditJson={onEditJson}
                  onDuplicate={onDuplicate}
                  onRemove={onRemove}
                  editLabel="Edit workflow"
                  duplicateLabel="Duplicate workflow"
                  removeLabel="Delete workflow"
                />
                <div className="h-6 w-px bg-border mx-2"></div>
                <LayerMoveControls
                  onMoveUp={onMoveUp}
                  onMoveDown={onMoveDown}
                  onMoveToTop={onMoveToTop}
                  onMoveToBottom={onMoveToBottom}
                  canMoveUp={!isFirst}
                  canMoveDown={!isLast}
                  canMoveToTop={!isFirst}
                  canMoveToBottom={!isLast}
                />
              </div>
            </div>
          )}

          <div className={`flex ${isRenaming ? '' : 'pr-[28rem]'}`}>
            {isRenaming ? (
              <div className="flex items-center gap-2 flex-1 p-2 -ml-2 mx-[6px] px-[6px]">
                <div className="h-4 w-4 flex-shrink-0" />
                <Input
                  ref={inputRef}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter') handleConfirmRename();
                    else if (e.key === 'Escape') handleCancelRename();
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="text-sm font-bold h-6 flex-1"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleConfirmRename(); }}
                  className="h-5 w-5 p-0 bg-green-600 hover:bg-green-700 flex-shrink-0"
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCancelRename(); }}
                  className="h-5 w-5 p-0 flex-shrink-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <CollapsibleTrigger className="group flex gap-2 hover:bg-muted/50 p-2 rounded-md -ml-2 flex-1 py-2 mx-[6px] px-[6px]">
                <div className="flex-shrink-0 mt-[2px]">
                  {expanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="text-left flex items-center gap-1.5 flex-1 min-w-0">
                  <h3 className="text-sm font-bold truncate">{title}</h3>
                  <button
                    onClick={handleStartRename}
                    className="opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100 p-0.5 rounded hover:bg-muted/80 transition-opacity text-muted-foreground hover:text-foreground"
                    title="Rename workflow"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                </div>
              </CollapsibleTrigger>
            )}
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0 pl-[46px]">
            {/* Service details (workflow-specific) */}
            {(() => {
              const sd = workflow.serviceDetails;
              const hasAny = !!(sd?.endpoint || sd?.namespace || sd?.application);
              return (
                <div className="space-y-2 -mt-2">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-sm font-medium text-foreground">Execution Details</h4>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={onEdit}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {hasAny ? (
                    <div className="text-xs text-muted-foreground space-y-1 ml-6">
                      {sd?.endpoint && (
                        <div>
                          <span className="font-medium">Endpoint:</span> {sd.endpoint}
                        </div>
                      )}
                      {sd?.namespace && (
                        <div>
                          <span className="font-medium">Namespace:</span> {sd.namespace}
                        </div>
                      )}
                      {sd?.application && (
                        <div>
                          <span className="font-medium">Application:</span> {sd.application}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground ml-6">No service details configured</p>
                  )}
                </div>
              );
            })()}


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
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default WorkflowCard;
