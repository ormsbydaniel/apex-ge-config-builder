import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus } from 'lucide-react';
import { useConfig } from '@/contexts/ConfigContext';
import { useConfigBuilderState } from '@/hooks/useConfigBuilderState';
import { Story, StoryStep } from '@/types/config';
import { validateStories } from '@/utils/storyValidation';
import SortableStoryGroup from './storymaps/SortableStoryGroup';
import StoryFormDialog from './storymaps/StoryFormDialog';
import type { StoryImportSelection } from './storymaps/import/StoryImportPanel';
import { cloneDonorLayer } from '@/utils/donorImport';
import { remapStoryLayerRefs, uniqueStoryId, uniqueStoryTitle } from '@/utils/storyImport';
import { toast } from 'sonner';


const slugify = (s: string): string =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'step';

const uniqueId = (base: string, existing: string[]): string => {
  if (!existing.includes(base)) return base;
  let n = 2;
  while (existing.includes(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
};

const StorymapsTab: React.FC = () => {
  const { dispatch } = useConfig();
  const {
    config,
    stories,
    addStory,
    updateStory,
    removeStory,
    duplicateStory,
    moveStory,
    addStep,
    updateStep,
    removeStep,
    duplicateStep,
    moveStep,
  } = useConfigBuilderState() as any;

  const list: Story[] = stories ?? [];

  const [addOpen, setAddOpen] = useState(false);
  const [editStoryIndex, setEditStoryIndex] = useState<number | null>(null);
  const [expandedCount, setExpandedCount] = useState(0);

  const handleExpandedChange = useCallback((open: boolean) => {
    setExpandedCount((c) => (open ? c + 1 : Math.max(0, c - 1)));
  }, []);

  // Track dirty step editors so we can gate the Preview tab.
  const [dirtySteps, setDirtySteps] = useState<Set<string>>(new Set());
  useEffect(() => {
    const hasDirty = dirtySteps.size > 0;
    dispatch({
      type: 'SET_UNSAVED_FORM_CHANGES',
      payload: {
        hasChanges: hasDirty,
        description: hasDirty ? 'storymap step editor' : null,
      },
    });
    return () => {
      // Clear on unmount to avoid stale flags.
      dispatch({
        type: 'SET_UNSAVED_FORM_CHANGES',
        payload: { hasChanges: false, description: null },
      });
    };
  }, [dirtySteps, dispatch]);

  const setStepDirty = (key: string, dirty: boolean) => {
    setDirtySteps((prev) => {
      const next = new Set(prev);
      if (dirty) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const warnings = useMemo(
    () => validateStories(list, config.sources ?? []),
    [list, config.sources],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const storyIds = list.map((s, i) => `story-${s.id ?? 'unnamed'}-${i}`);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = storyIds.indexOf(String(active.id));
    const to = storyIds.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    moveStory(from, to);
  };

  const handleAddStory = (patch: { id: string; title: string; description?: string; isActive?: boolean; thumbnail?: string }) => {
    const existingIds = list.map((s) => s.id);
    const newStory: Story = {
      id: uniqueId(patch.id, existingIds),
      title: patch.title,
      description: patch.description,
      isActive: patch.isActive,
      thumbnail: patch.thumbnail,
      steps: [],
    };
    addStory(newStory);
  };

  /**
   * Import one or more stories from a donor config. Any donor layers the user
   * ticked are cloned first (cloning mints fresh ids), then each story's layer
   * references are remapped onto those new ids. References to layers that were
   * not imported are dropped.
   */
  const handleImportStories = (selection: StoryImportSelection) => {
    const { stories, layers } = selection;
    if (!Array.isArray(stories) || stories.length === 0) return;

    const currentSources: any[] = config.sources ?? [];
    const existingNames = new Set<string>(
      currentSources.map((s: any) => s?.name).filter((n: any) => typeof n === 'string'),
    );
    const existingSourceIds = new Set<string>(
      currentSources.map((s: any) => s?.id).filter((v: any) => typeof v === 'string' && v),
    );

    // Donor id -> target id. Layers already present keep their id.
    const idMap = new Map<string, string>();
    for (const id of existingSourceIds) idMap.set(id, id);

    let addedLayers = 0;
    for (const donor of layers ?? []) {
      if (!donor || typeof donor.id !== 'string') continue;
      const cloned = cloneDonorLayer(donor, {
        interfaceGroup: donor?.layout?.interfaceGroup,
        subinterfaceGroup: donor?.layout?.subinterfaceGroup,
        existingNames,
        existingIds: existingSourceIds,
      });
      dispatch({ type: 'ADD_SOURCE', payload: cloned });
      idMap.set(donor.id, cloned.id);
      addedLayers += 1;
    }

    const storyIdPool = list.map((s) => s.id);
    const storyTitlePool = list.map((s) => s.title).filter(Boolean) as string[];
    let droppedRefs = 0;

    for (const donorStory of stories) {
      const { story: remapped, dropped } = remapStoryLayerRefs(donorStory, idMap);
      droppedRefs += dropped;
      const nextId = uniqueStoryId(remapped.id, storyIdPool);
      const nextTitle = uniqueStoryTitle(remapped.title ?? 'Imported story', storyTitlePool);
      storyIdPool.push(nextId);
      storyTitlePool.push(nextTitle);
      addStory({ ...remapped, id: nextId, title: nextTitle });
    }

    const bits: string[] = [];
    if (addedLayers > 0) bits.push(`${addedLayers} layer${addedLayers === 1 ? '' : 's'} imported`);
    if (droppedRefs > 0)
      bits.push(`${droppedRefs} layer reference${droppedRefs === 1 ? '' : 's'} removed`);
    toast({
      title: `Imported ${stories.length} stor${stories.length === 1 ? 'y' : 'ies'}`,
      description: bits.length ? bits.join(' · ') : undefined,
    });
  };


  const handleEditStory = (index: number, patch: { id: string; title: string; description?: string; isActive?: boolean; thumbnail?: string }) => {
    const original = list[index];
    if (!original) return;
    const otherIds = list.filter((_, i) => i !== index).map((s) => s.id);
    updateStory(index, {
      ...original,
      id: original.id === patch.id ? original.id : uniqueId(patch.id, otherIds),
      title: patch.title,
      description: patch.description,
      isActive: patch.isActive,
      thumbnail: patch.thumbnail,
    });
  };

  const handleAddStep = (storyIndex: number) => {
    const story = list[storyIndex];
    if (!story) return;
    const existingIds = (story.steps ?? []).map((s) => s.id);
    const title = `Step ${(story.steps?.length ?? 0) + 1}`;
    const newStep: StoryStep = {
      id: uniqueId(slugify(title), existingIds),
      content: { title },
      activeLayers: [],
      viewport: { zoom: 4, center: [0, 0] },
    };
    addStep(storyIndex, newStep);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Stories
          <span className="text-sm font-normal text-muted-foreground">
            ({list.length})
          </span>
        </CardTitle>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add story
        </Button>
      </CardHeader>
      {(list.length === 0 || expandedCount === 0) && (
        <div className="mx-6 mb-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
          Stories provide users with a &apos;curated&apos; walk through that can be used to
          provide an experience that guides a use through the layers and features in a GE
          config. A story is made up of steps, with each step comprising of content, active
          layers and actions.
        </div>
      )}
      <CardContent className="space-y-3">
        {list.length === 0 ? (
          <div className="border border-dashed rounded-md py-10 text-center text-sm text-muted-foreground">
            <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="mb-3">No storymaps yet</p>
            <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add story
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={storyIds} strategy={verticalListSortingStrategy}>
              {list.map((story, i) => (
                <SortableStoryGroup
                  key={storyIds[i]}
                  id={storyIds[i]}
                  storyIndex={i}
                  story={story}
                  sources={config.sources ?? []}
                  warnings={warnings}
                  onEditStory={() => setEditStoryIndex(i)}
                  onRenameStory={(title) => updateStory(i, { ...story, title })}
                  onDuplicateStory={() => duplicateStory(i)}
                  onRemoveStory={() => removeStory(i)}
                  onAddStep={() => handleAddStep(i)}
                  onUpdateStep={(stepIndex, next) => updateStep(i, stepIndex, next)}
                  onDuplicateStep={(stepIndex) => duplicateStep(i, stepIndex)}
                  onRemoveStep={(stepIndex) => removeStep(i, stepIndex)}
                  onMoveStep={(from, to) => moveStep(i, from, to)}
                  onReplaceSteps={(nextSteps) => updateStory(i, { ...story, steps: nextSteps })}
                  onStepDirtyChange={(stepIndex, dirty) =>
                    setStepDirty(`${i}:${stepIndex}`, dirty)
                  }
                  onExpandedChange={handleExpandedChange}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </CardContent>

      <StoryFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        existingIds={list.map((s) => s.id)}
        onSave={handleAddStory}
      />

      <StoryFormDialog
        open={editStoryIndex !== null}
        onOpenChange={(open) => { if (!open) setEditStoryIndex(null); }}
        initial={editStoryIndex !== null ? list[editStoryIndex] : null}
        existingIds={list.map((s) => s.id)}
        onSave={(patch) => {
          if (editStoryIndex !== null) handleEditStory(editStoryIndex, patch);
          setEditStoryIndex(null);
        }}
      />
    </Card>
  );
};

export default StorymapsTab;
