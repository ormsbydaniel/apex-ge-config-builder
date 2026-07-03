import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  ChevronDown,
  ChevronRight,
  Copy,
  Trash2,
  AlertTriangle,
  Compass,
  Crosshair,
  Layers as LayersIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { DataSource, StoryStep } from '@/types/config';
import { StoryWarning } from '@/utils/storyValidation';
import StepEditor from './StepEditor';
import { cn } from '@/lib/utils';

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

/** Pill helper matching the layer card `<Badge variant="outline">` treatment. */
const Pill: React.FC<{
  tint?: 'neutral' | 'info' | 'amber';
  icon?: React.ReactNode;
  children: React.ReactNode;
}> = ({ tint = 'neutral', icon, children }) => {
  const tintCls =
    tint === 'info'
      ? 'border-blue-300 text-blue-700'
      : tint === 'amber'
      ? 'border-amber-300 text-amber-700'
      : 'border-border text-foreground/70';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border bg-background px-2 py-0.5 text-[11px] leading-none',
        tintCls,
      )}
    >
      {icon}
      {children}
    </span>
  );
};

const viewportPill = (v: StoryStep['viewport']) => {
  if ('fitLayer' in v) {
    return (
      <Pill tint="info" icon={<Crosshair className="h-3 w-3" />}>
        Fit: {v.fitLayer}
      </Pill>
    );
  }
  return (
    <Pill tint="info" icon={<Compass className="h-3 w-3" />}>
      Zoom {v.zoom} · [{v.center[0]}, {v.center[1]}]
      {v.duration ? ` · ${v.duration}ms` : ''}
    </Pill>
  );
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
              className="group flex items-center gap-2 flex-1 min-w-0 text-left hover:bg-muted/50 rounded-md -mx-1 px-1 py-1"
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              <h3 className="text-sm font-bold truncate">
                {step.title || '(untitled)'}
              </h3>
            </button>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Pill>
                Step {index + 1}/{totalSteps}
              </Pill>
              {viewportPill(step.viewport)}
              {activeCount > 0 && (
                <Pill icon={<LayersIcon className="h-3 w-3" />}>
                  {activeCount} layer{activeCount === 1 ? '' : 's'}
                </Pill>
              )}
              {hasWarnings && (
                <TooltipProvider>
                  <Tooltip delayDuration={400}>
                    <TooltipTrigger asChild>
                      <span>
                        <Pill tint="amber" icon={<AlertTriangle className="h-3 w-3" />}>
                          {warnings!.length}
                        </Pill>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <ul className="text-xs space-y-1">
                        {warnings!.map((w, i) => (
                          <li key={i}>{w.message}</li>
                        ))}
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              <div className="h-6 w-px bg-border mx-1" />

              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onDuplicate}
                        className="border-blue-500/30 text-blue-600 hover:bg-blue-50 h-6 w-6 p-0"
                        aria-label="Duplicate step"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Duplicate step</p></TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onRemove}
                        className="text-destructive hover:bg-destructive/10 border-destructive/30 h-6 w-6 p-0"
                        aria-label="Delete step"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Delete step</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </CardHeader>

          {expanded && (
            <CardContent className="px-3 pb-3 pt-0">
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
