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
  FileText,
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
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(story.title);

  const commitTitle = () => {
    const next = titleDraft.trim();
    if (next && next !== story.title) onRenameStory(next);
    else setTitleDraft(story.title);
    setEditingTitle(false);
  };
  const cancelTitle = () => {
    setTitleDraft(story.title);
    setEditingTitle(false);
  };

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
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <button
                type="button"
                onClick={() => setCollapsed((c) => !c)}
                className="flex-shrink-0"
                aria-label={collapsed ? 'Expand story' : 'Collapse story'}
              >
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {editingTitle ? (
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <Input
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); commitTitle(); }
                      else if (e.key === 'Escape') { e.preventDefault(); cancelTitle(); }
                    }}
                    autoFocus
                    className="h-8 text-base font-semibold"
                  />
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={commitTitle} title="Save">
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancelTitle} title="Cancel">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setCollapsed((c) => !c)}
                    className="text-base font-semibold text-primary truncate text-left"
                  >
                    {story.title}
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => { setTitleDraft(story.title); setEditingTitle(true); }}
                    title="Rename story"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
              <Badge variant="outline" className="text-[10px] font-normal">
                {steps.length} step{steps.length === 1 ? '' : 's'}
              </Badge>
              {totalWarnings > 0 && (
                <Badge variant="outline" className="text-[10px] font-normal text-amber-700 border-amber-400">
                  {totalWarnings} warning{totalWarnings === 1 ? '' : 's'}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onAddStep}
                className="text-primary hover:bg-primary/10 border-primary/30"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Step
              </Button>
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
          </div>

          {!collapsed && (
            <div className="p-3 space-y-3">
              {/* Story info: matches layer card "Description & Attribution" pattern */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-medium text-foreground">Description</h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={onEditStory}
                    title="Edit story info"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground space-y-1 ml-6">
                  {story.description ? (
                    <p className="whitespace-pre-wrap">{story.description}</p>
                  ) : (
                    <p className="italic">No description configured</p>
                  )}
                  <div>
                    <span className="font-medium">ID:</span> {story.id}
                  </div>
                </div>
              </div>

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
