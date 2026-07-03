import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStoryActions } from '@/hooks/useStoryActions';
import { Story } from '@/types/config';

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const makeStory = (overrides: Partial<Story> = {}): Story => ({
  id: 's1',
  title: 'Story 1',
  steps: [
    {
      id: 'step1',
      title: 'Step 1',
      layers: { active: [] },
      viewport: { fitLayer: 'a' },
    },
  ],
  ...overrides,
});

describe('useStoryActions', () => {
  const setup = (initial: Story[] = []) => {
    let payload: Story[] = initial;
    const dispatch = vi.fn((action: any) => {
      if (action.type === 'UPDATE_STORIES') payload = action.payload;
    });
    const config = { get stories() { return payload; } };
    const hook = renderHook(() => useStoryActions({ config: config as any, dispatch }));
    return { hook, dispatch, getPayload: () => payload };
  };

  it('adds and removes a story', () => {
    const { hook, getPayload } = setup();
    act(() => hook.result.current.addStory(makeStory()));
    expect(getPayload()).toHaveLength(1);

    hook.rerender();
    act(() => hook.result.current.removeStory(0));
    expect(getPayload()).toHaveLength(0);
  });

  it('duplicates a story with a distinct id', () => {
    const { hook, getPayload } = setup([makeStory()]);
    act(() => hook.result.current.duplicateStory(0));
    const list = getPayload();
    expect(list).toHaveLength(2);
    expect(list[1].id).not.toBe(list[0].id);
  });

  it('moves a story', () => {
    const { hook, getPayload } = setup([
      makeStory({ id: 'a', title: 'A' }),
      makeStory({ id: 'b', title: 'B' }),
    ]);
    act(() => hook.result.current.moveStory(0, 1));
    expect(getPayload().map((s) => s.id)).toEqual(['b', 'a']);
  });

  it('adds a step to a story', () => {
    const { hook, getPayload } = setup([makeStory()]);
    act(() =>
      hook.result.current.addStep(0, {
        id: 'step2',
        title: 'Step 2',
        layers: { active: [] },
        viewport: { fitLayer: 'a' },
      }),
    );
    expect(getPayload()[0].steps).toHaveLength(2);
  });

  it('updates, moves, duplicates and removes steps', () => {
    const { hook, getPayload } = setup([makeStory()]);

    act(() =>
      hook.result.current.updateStep(0, 0, {
        id: 'step1',
        title: 'Renamed',
        layers: { active: [] },
        viewport: { fitLayer: 'a' },
      }),
    );
    expect(getPayload()[0].steps[0].title).toBe('Renamed');

    hook.rerender();
    act(() => hook.result.current.duplicateStep(0, 0));
    expect(getPayload()[0].steps).toHaveLength(2);

    hook.rerender();
    act(() => hook.result.current.moveStep(0, 0, 1));
    expect(getPayload()[0].steps[1].id).toBe('step1');

    hook.rerender();
    act(() => hook.result.current.removeStep(0, 0));
    expect(getPayload()[0].steps).toHaveLength(1);
  });
});
