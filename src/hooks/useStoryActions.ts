import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Story, StoryStep } from '@/types/config';

interface UseStoryActionsProps {
  config: { stories?: Story[] };
  dispatch: (action: any) => void;
}

/**
 * Story + step CRUD. All handlers dispatch a single UPDATE_STORIES action
 * carrying the next full array (Core memory: merge updates into a single
 * dispatch to prevent race conditions).
 */
export const useStoryActions = ({ config, dispatch }: UseStoryActionsProps) => {
  const { toast } = useToast();

  const list = (): Story[] => config.stories ?? [];

  const commit = (next: Story[]) =>
    dispatch({ type: 'UPDATE_STORIES', payload: next });

  // ---------- Stories ----------

  const addStory = useCallback((story: Story) => {
    commit([...list(), story]);
    toast({ title: 'Story added', description: story.title });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.stories, dispatch, toast]);

  const updateStory = useCallback((index: number, story: Story) => {
    const current = list();
    if (index < 0 || index >= current.length) return;
    commit(current.map((s, i) => (i === index ? story : s)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.stories, dispatch]);

  const removeStory = useCallback((index: number) => {
    const current = list();
    if (index < 0 || index >= current.length) return;
    const removed = current[index];
    commit(current.filter((_, i) => i !== index));
    toast({ title: 'Story removed', description: removed.title });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.stories, dispatch, toast]);

  const duplicateStory = useCallback((index: number) => {
    const current = list();
    if (index < 0 || index >= current.length) return;
    const original = current[index];
    const copy: Story = JSON.parse(JSON.stringify(original));
    copy.id = `${original.id}_copy`;
    copy.title = `${original.title} (copy)`;
    commit([...current.slice(0, index + 1), copy, ...current.slice(index + 1)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.stories, dispatch]);

  const moveStory = useCallback((fromIndex: number, toIndex: number) => {
    const current = list();
    if (
      fromIndex < 0 || fromIndex >= current.length ||
      toIndex < 0 || toIndex >= current.length ||
      fromIndex === toIndex
    ) return;
    const next = [...current];
    const [item] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, item);
    commit(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.stories, dispatch]);

  // ---------- Steps (scoped to a story) ----------

  const patchStorySteps = (
    storyIndex: number,
    fn: (steps: StoryStep[]) => StoryStep[],
  ) => {
    const current = list();
    if (storyIndex < 0 || storyIndex >= current.length) return;
    const story = current[storyIndex];
    const nextSteps = fn(story.steps ?? []);
    const nextStory: Story = { ...story, steps: nextSteps };
    commit(current.map((s, i) => (i === storyIndex ? nextStory : s)));
  };

  const addStep = useCallback((storyIndex: number, step: StoryStep) => {
    patchStorySteps(storyIndex, (steps) => [...steps, step]);
    toast({ title: 'Step added', description: step.content?.title ?? step.id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.stories, dispatch, toast]);

  const updateStep = useCallback(
    (storyIndex: number, stepIndex: number, step: StoryStep) => {
      patchStorySteps(storyIndex, (steps) =>
        steps.map((s, i) => (i === stepIndex ? step : s)),
      );
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [config.stories, dispatch],
  );

  const removeStep = useCallback((storyIndex: number, stepIndex: number) => {
    patchStorySteps(storyIndex, (steps) => steps.filter((_, i) => i !== stepIndex));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.stories, dispatch]);

  const duplicateStep = useCallback((storyIndex: number, stepIndex: number) => {
    patchStorySteps(storyIndex, (steps) => {
      if (stepIndex < 0 || stepIndex >= steps.length) return steps;
      const original = steps[stepIndex];
      const copy: StoryStep = JSON.parse(JSON.stringify(original));
      copy.id = `${original.id}_copy`;
      if (copy.content?.title) {
        copy.content = { ...copy.content, title: `${copy.content.title} (copy)` };
      }
      return [...steps.slice(0, stepIndex + 1), copy, ...steps.slice(stepIndex + 1)];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.stories, dispatch]);

  const moveStep = useCallback(
    (storyIndex: number, fromIndex: number, toIndex: number) => {
      patchStorySteps(storyIndex, (steps) => {
        if (
          fromIndex < 0 || fromIndex >= steps.length ||
          toIndex < 0 || toIndex >= steps.length ||
          fromIndex === toIndex
        ) return steps;
        const next = [...steps];
        const [item] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, item);
        return next;
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [config.stories, dispatch],
  );

  return {
    stories: list(),
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
  };
};
