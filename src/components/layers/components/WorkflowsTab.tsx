import React, { useState } from 'react';
import { DataSource, WorkflowItem } from '@/types/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, ChevronDown, ChevronRight, MoveUp, MoveDown, ChevronsUp, ChevronsDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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

  return (
    <div className="space-y-4">
      {workflows.map((workflow, workflowIndex) => {
        const isExpanded = expandedWorkflows.has(workflowIndex);
        
        // Extract additional properties (excluding zIndex, service, label)
        const { zIndex, service, label, ...additionalProps } = workflow;
        const hasAdditionalProps = Object.keys(additionalProps).length > 0;
        
        return (
          <Card key={workflowIndex}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-base">{label}</CardTitle>
                  <CardDescription className="text-sm space-y-1">
                    <div>Service: <span className="font-mono text-xs">{service}</span></div>
                    <div>zIndex: <span className="font-mono text-xs">{zIndex}</span></div>
                  </CardDescription>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {onMoveToTop && workflowIndex > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMoveToTop(layerIndex, workflowIndex)}
                      title="Move to top"
                    >
                      <ChevronsUp className="h-4 w-4" />
                    </Button>
                  )}
                  {onMoveUp && workflowIndex > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMoveUp(layerIndex, workflowIndex)}
                      title="Move up"
                    >
                      <MoveUp className="h-4 w-4" />
                    </Button>
                  )}
                  {onMoveDown && workflowIndex < workflows.length - 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMoveDown(layerIndex, workflowIndex)}
                      title="Move down"
                    >
                      <MoveDown className="h-4 w-4" />
                    </Button>
                  )}
                  {onMoveToBottom && workflowIndex < workflows.length - 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMoveToBottom(layerIndex, workflowIndex)}
                      title="Move to bottom"
                    >
                      <ChevronsDown className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(layerIndex, workflowIndex)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(layerIndex, workflowIndex)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            {hasAdditionalProps && (
              <CardContent>
                <Collapsible open={isExpanded} onOpenChange={() => toggleWorkflow(workflowIndex)}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start p-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 mr-2" />
                      ) : (
                        <ChevronRight className="h-4 w-4 mr-2" />
                      )}
                      <span className="text-sm font-medium">
                        Additional Properties ({Object.keys(additionalProps).length})
                      </span>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2">
                    <div className="rounded-md bg-muted/50 p-3 space-y-2">
                      {Object.entries(additionalProps).map(([key, value]) => (
                        <div key={key} className="flex gap-2 text-sm">
                          <span className="font-medium text-muted-foreground">{key}:</span>
                          <span className="font-mono text-xs break-all">{JSON.stringify(value)}</span>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            )}
          </Card>
        );
      })}

      {workflows.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No workflows configured for this layer.
        </div>
      )}

      <Button onClick={() => onAdd(layerIndex)} className="w-full">
        Add Workflow
      </Button>
    </div>
  );
}
