import { DataSource } from '@/types/config';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Edit, Power, PowerOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface WorkflowsTabProps {
  source: DataSource;
  layerIndex: number;
  onAdd: (layerIndex: number) => void;
  onRemove: (layerIndex: number, workflowIndex: number) => void;
  onEdit: (layerIndex: number, workflowIndex: number) => void;
}

export function WorkflowsTab({
  source,
  layerIndex,
  onAdd,
  onRemove,
  onEdit,
}: WorkflowsTabProps) {
  const hasWorkflows = source.workflows && source.workflows.length > 0;
  const [expandedWorkflows, setExpandedWorkflows] = useState<Set<number>>(new Set());

  const toggleWorkflow = (index: number) => {
    setExpandedWorkflows(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAdd(layerIndex)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Workflow
        </Button>
      </div>

      {hasWorkflows ? (
        <div className="space-y-3">
          {source.workflows.map((workflow, index) => (
            <Card key={index}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{workflow.name}</h4>
                      <Badge variant={workflow.enabled ? 'default' : 'secondary'} className="text-xs gap-1">
                        {workflow.enabled ? (
                          <>
                            <Power className="h-3 w-3" />
                            Enabled
                          </>
                        ) : (
                          <>
                            <PowerOff className="h-3 w-3" />
                            Disabled
                          </>
                        )}
                      </Badge>
                    </div>
                    
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="font-mono text-xs truncate">{workflow.endpoint}</div>
                      <div className="text-xs text-muted-foreground">ID: {workflow.id}</div>
                    </div>

                    <Collapsible open={expandedWorkflows.has(index)}>
                      <CollapsibleTrigger 
                        onClick={() => toggleWorkflow(index)}
                        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ChevronDown className={`h-3 w-3 transition-transform ${expandedWorkflows.has(index) ? 'rotate-180' : ''}`} />
                        Parameters ({Object.keys(workflow.parameters || {}).length})
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2">
                        <div className="rounded-md bg-muted p-3">
                          <pre className="text-xs font-mono overflow-x-auto">
                            {JSON.stringify(workflow.parameters, null, 2)}
                          </pre>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(layerIndex, index)}
                    >
                      <Edit className="h-4 w-4" />
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
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-muted/50 p-8 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            No workflows configured yet
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Workflows define processing endpoints with configurable parameters
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAdd(layerIndex)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Your First Workflow
          </Button>
        </div>
      )}
    </div>
  );
}
