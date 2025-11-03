import React, { useState } from 'react';
import { DataSource, WorkflowItem } from '@/types/config';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import LayerMoveControls from './LayerMoveControls';

interface WorkflowsTabProps {
  source: DataSource;
  layerIndex: number;
  onAdd: (layerIndex: number) => void;
  onRemove: (layerIndex: number, workflowIndex: number) => void;
  onEdit: (layerIndex: number, workflowIndex: number) => void;
  onMoveUp?: (layerIndex: number, workflowIndex: number) => void;
  onMoveDown?: (layerIndex: number, workflowIndex: number) => void;
  onMoveToTop?: (layerIndex: number, workflowIndex: number) => void;
  onMoveToBottom?: (layerIndex: number, workflowIndex: number) => void;
}

export function WorkflowsTab({ 
  source, 
  layerIndex, 
  onAdd, 
  onRemove, 
  onEdit,
  onMoveUp,
  onMoveDown,
  onMoveToTop,
  onMoveToBottom
}: WorkflowsTabProps) {
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

  const workflows = source.workflows || [];
  const hasWorkflows = workflows.length > 0;

  return (
    <div className="space-y-4">
      {hasWorkflows ? (
        <div className="space-y-3">
          {workflows.map((workflow, workflowIndex) => {
            const isExpanded = expandedWorkflows.has(workflowIndex);
            
            // Extract additional properties (excluding zIndex, service, label)
            const { zIndex, service, label, ...additionalProps } = workflow;
            const hasAdditionalProps = Object.keys(additionalProps).length > 0;
            
            return (
              <Card key={workflowIndex} className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    {/* Line 1: Service name with move controls and action buttons */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Badge variant="outline" className="text-xs shrink-0">
                          zIndex: {zIndex}
                        </Badge>
                        <span className="text-sm font-medium truncate">
                          {label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {onMoveUp && onMoveDown && onMoveToTop && onMoveToBottom && (
                          <LayerMoveControls
                            onMoveUp={() => onMoveUp(layerIndex, workflowIndex)}
                            onMoveDown={() => onMoveDown(layerIndex, workflowIndex)}
                            onMoveToTop={() => onMoveToTop(layerIndex, workflowIndex)}
                            onMoveToBottom={() => onMoveToBottom(layerIndex, workflowIndex)}
                            canMoveUp={workflowIndex > 0}
                            canMoveDown={workflowIndex < workflows.length - 1}
                            canMoveToTop={workflowIndex > 0}
                            canMoveToBottom={workflowIndex < workflows.length - 1}
                          />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(layerIndex, workflowIndex)}
                          className="h-8 w-8 p-0"
                          title="Edit Workflow"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemove(layerIndex, workflowIndex)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          title="Delete Workflow"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Line 2: Service info */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Service: <span className="font-mono">{service}</span>
                      </span>
                    </div>

                    {/* Additional properties collapsible */}
                    {hasAdditionalProps && (
                      <Collapsible open={isExpanded} onOpenChange={() => toggleWorkflow(workflowIndex)}>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground">
                            {isExpanded ? (
                              <ChevronDown className="h-3 w-3 mr-1" />
                            ) : (
                              <ChevronRight className="h-3 w-3 mr-1" />
                            )}
                            Additional Properties ({Object.keys(additionalProps).length})
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-2">
                          <div className="rounded-md bg-background p-3 space-y-1">
                            {Object.entries(additionalProps).map(([key, value]) => (
                              <div key={key} className="flex gap-2 text-xs">
                                <span className="font-medium text-muted-foreground min-w-[80px]">{key}:</span>
                                <span className="font-mono break-all">{JSON.stringify(value)}</span>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-muted/50 p-8 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            No workflows configured yet
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Workflows define processing endpoints with configurable parameters
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
          Add Workflow
        </Button>
      </div>
    </div>
  );
}

