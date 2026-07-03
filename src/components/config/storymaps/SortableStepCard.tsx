import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  ChevronDown,
  ChevronRight,
  Copy,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { DataSource, StoryStep } from '@/types/config';
import { StoryWarning } from '@/utils/storyValidation';
import StepEditor from './StepEditor';

interface SortableStepCardProps {
  id: string;
  step: StoryStep;
  index: number;
  totalSteps: number;
  sources: DataSource[];
  warnings?: StoryWarning[];
  expanded: boolean;
  onToggleExpanded: () => void;
  onSave: (next: StoryStep) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}

const summariseViewport = (v: StoryStep['viewport']): string => {
  if ('fitLayer' in v) return `Fit: ${v.fitLayer}`;
  return `Zoom ${v.zoom} · [${v.center[0]}, ${v.center[1]}]${v.duration ? ` · ${v.duration}ms` : ''}`;
};

export const SortableStepCard: React.FC<SortableStepCardProps> = ({
  id,
  step,
  index,
  totalSteps,
  sources,
  warnings,
  expanded,
  onToggleExpanded,
  onSave,
  onDuplicate,
  onRemove,
  onDirtyChange,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: 'relative',
    zIndex: isDragging ? 50 : undefined,
  };

  const activeCount = step.layers?.active?.length ?? 0;
  const hasWarnings = (warnings?.length ?? 0) > 0;

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="flex items-stretch gap-2">
        <div
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-muted/50 rounded transition-colors flex-shrink-0 flex items-center"
          title="Drag to reorder"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        <Card className="flex-1 min-w-0">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 py-2 px-3">
            <button
              type="button"
              onClick={onToggleExpanded}
              className="flex items-center gap-2 flex-1 min-w-0 text-left"
            >
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <span className="text-xs text-muted-foreground">
                Step {index + 1} of {totalSteps}
              </span>
              <span className="font-medium text-sm truncate">{step.title || '(untitled)'}</span>
              <Badge variant="outline" className="text-[10px] font-normal">
                {summariseViewport(step.viewport)}
              </Badge>
              {activeCount > 0 && (
                <Badge variant="outline" className="text-[10px] font-normal">
                  {activeCount} layer{activeCount === 1 ? '' : 's'}
                </Badge>
              )}
              {hasWarnings && (
                <TooltipProvider>
                  <Tooltip delayDuration={400}>
                    <TooltipTrigger asChild>
                      <span className="text-amber-600 inline-flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span className="text-[10px]">{warnings!.length}</span>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <ul className="text-xs space-y-1">
                        {warnings!.map((w, i) => <li key={i}>{w.message}</li>)}
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </button>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={onDuplicate}
                className="border-blue-500/30 text-blue-600 hover:bg-blue-50 h-6 w-6 p-0"
                aria-label="Duplicate step"
                title="Duplicate step"
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onRemove}
                className="text-destructive hover:bg-destructive/10 border-destructive/30 h-6 w-6 p-0"
                aria-label="Delete step"
                title="Delete step"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>

          {expanded && (
            <CardContent className="px-3 pb-3">
              <StepEditor
                step={step}
                sources={sources}
                warnings={warnings}
                onSave={onSave}
                onCancel={onToggleExpanded}
                onDirtyChange={onDirtyChange}
              />
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default SortableStepCard;
