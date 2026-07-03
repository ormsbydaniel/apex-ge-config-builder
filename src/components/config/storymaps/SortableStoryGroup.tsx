import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  GripVertical,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Copy,
  Trash2,
  Pencil,
  Plus,
  Check,
  X,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataSource, Story, StoryStep } from '@/types/config';
import { StepWarningsMap, stepKey } from '@/utils/storyValidation';
import SortableStepCard from './SortableStepCard';

interface SortableStoryGroupProps {
  id: string;
  storyIndex: number;
  story: Story;
  sources: DataSource[];
  warnings: StepWarningsMap;
  onEditStory: () => void;
  onRenameStory: (title: string) => void;
  onDuplicateStory: () => void;
  onRemoveStory: () => void;
  onAddStep: () => void;
  onUpdateStep: (stepIndex: number, next: StoryStep) => void;
  onDuplicateStep: (stepIndex: number) => void;
  onRemoveStep: (stepIndex: number) => void;
  onMoveStep: (fromIndex: number, toIndex: number) => void;
  onStepDirtyChange?: (stepIndex: number, dirty: boolean) => void;
}

export const SortableStoryGroup: React.FC<SortableStoryGroupProps> = ({
  id,
  storyIndex,
  story,
  sources,
  warnings,
  onEditStory,
  onRenameStory,
  onDuplicateStory,
  onRemoveStory,
  onAddStep,
  onUpdateStep,
  onDuplicateStep,
  onRemoveStep,
  onMoveStep,
  onStepDirtyChange,
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
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    zIndex: isDragging ? 100 : undefined,
  };

  const [collapsed, setCollapsed] = useState(false);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const steps = story.steps ?? [];
  const stepIds = steps.map((s, i) => `story-${storyIndex}-step-${s.id ?? i}-${i}`);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = stepIds.indexOf(String(active.id));
    const to = stepIds.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    onMoveStep(from, to);
  };

  const totalWarnings = steps.reduce(
    (sum, _s, i) => sum + (warnings.get(stepKey(storyIndex, i))?.length ?? 0),
    0,
  );

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="relative">
      <div className="flex items-stretch gap-2">
        <div
          {...listeners}
          className="cursor-grab active:cursor-grabbing px-2 hover:bg-muted/50 rounded transition-colors flex-shrink-0 flex items-center"
          title="Drag to reorder story"
        >
          <GripVertical className="h-5 w-5 text-primary/70" />
        </div>

        <div className="flex-1 min-w-0 border border-primary/20 rounded-lg bg-muted/10">
          {/* Group header row */}
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-primary/10">
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="flex items-center gap-2 flex-1 min-w-0 text-left"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Story</span>
              <span className="font-semibold text-sm truncate">{story.title}</span>
              <Badge variant="outline" className="text-[10px] font-normal">
                {steps.length} step{steps.length === 1 ? '' : 's'}
              </Badge>
              {totalWarnings > 0 && (
                <Badge variant="outline" className="text-[10px] font-normal text-amber-700 border-amber-400">
                  {totalWarnings} warning{totalWarnings === 1 ? '' : 's'}
                </Badge>
              )}
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEditStory}>
                  <Pencil className="h-3.5 w-3.5 mr-2" /> Edit story info
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDuplicateStory}>
                  <Copy className="h-3.5 w-3.5 mr-2" /> Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onRemoveStory} className="text-destructive">
                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {!collapsed && (
            <div className="p-3 space-y-3">
              {/* Story parent card (the deliberate deviation from the interface-group analogy) */}
              <Card className="border-primary/20">
                <CardContent className="py-3 px-3 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Story info</p>
                      <p className="font-semibold text-sm">{story.title}</p>
                      <p className="text-[11px] text-muted-foreground">ID: {story.id}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onEditStory}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                  </div>
                  {story.description && (
                    <p className="text-sm whitespace-pre-wrap text-muted-foreground border-l-2 border-muted pl-2 mt-2">
                      {story.description}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Steps */}
              <div className="space-y-2">
                {steps.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No steps yet.
                  </p>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext items={stepIds} strategy={verticalListSortingStrategy}>
                      {steps.map((step, i) => (
                        <SortableStepCard
                          key={stepIds[i]}
                          id={stepIds[i]}
                          step={step}
                          index={i}
                          totalSteps={steps.length}
                          sources={sources}
                          warnings={warnings.get(stepKey(storyIndex, i))}
                          expanded={expandedStep === i}
                          onToggleExpanded={() =>
                            setExpandedStep((v) => (v === i ? null : i))
                          }
                          onSave={(next) => {
                            onUpdateStep(i, next);
                            setExpandedStep(null);
                          }}
                          onDuplicate={() => onDuplicateStep(i)}
                          onRemove={() => onRemoveStep(i)}
                          onDirtyChange={(d) => onStepDirtyChange?.(i, d)}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                )}

                <div>
                  <Button variant="outline" size="sm" onClick={onAddStep}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add step
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SortableStoryGroup;
