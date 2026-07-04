import React, { useState, useRef, useEffect } from 'react';
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
  Edit2,
  Check,
  X,
  FileJson,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
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
import StepJsonEditorDialog from './StepJsonEditorDialog';
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
  /** When true, auto-open the Content dialog on mount. */
  initiallyEditingContent?: boolean;
  /** Called if the user cancels the initial Content dialog on a new step. */
  onCancelNewStep?: () => void;
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
  initiallyEditingContent,
  onCancelNewStep,
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

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(step.title);
  const [jsonOpen, setJsonOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingTitle]);

  const startEditTitle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTitleDraft(step.title);
    setIsEditingTitle(true);
  };
  const confirmEditTitle = () => {
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== step.title) {
      onSave({ ...step, title: trimmed });
    }
    setIsEditingTitle(false);
  };
  const cancelEditTitle = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsEditingTitle(false);
    setTitleDraft(step.title);
  };

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
            {isEditingTitle ? (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span
                  className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full border border-border bg-muted text-[11px] font-semibold text-foreground/70 flex-shrink-0"
                  title={`Step ${index + 1} of ${totalSteps}`}
                >
                  {index + 1}
                </span>
                <Input
                  ref={inputRef}
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter') confirmEditTitle();
                    else if (e.key === 'Escape') cancelEditTitle();
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="text-sm font-bold h-6 flex-1"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); confirmEditTitle(); }}
                  className="h-5 w-5 p-0 bg-green-600 hover:bg-green-700 flex-shrink-0"
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); cancelEditTitle(); }}
                  className="h-5 w-5 p-0 flex-shrink-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
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
                <span
                  className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full border border-border bg-muted text-[11px] font-semibold text-foreground/70 flex-shrink-0"
                  title={`Step ${index + 1} of ${totalSteps}`}
                >
                  {index + 1}
                </span>
                <h3 className="text-sm font-bold truncate">
                  {step.title || '(untitled)'}
                </h3>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={startEditTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      setTitleDraft(step.title);
                      setIsEditingTitle(true);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-0.5 rounded hover:bg-muted/80 transition-opacity text-muted-foreground hover:text-foreground"
                  title="Rename step"
                >
                  <Edit2 className="h-3 w-3" />
                </span>
              </button>
            )}

            <div className="flex items-center gap-2 flex-shrink-0">
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
                initiallyEditingContent={initiallyEditingContent}
                onCancelNewStep={onCancelNewStep}
              />
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default SortableStepCard;
