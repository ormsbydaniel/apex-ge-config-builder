import { describe, it, expect } from 'vitest';
import {
  collectStoryLayerRefs,
  remapStoryLayerRefs,
  uniqueStoryId,
  uniqueStoryTitle,
} from '@/utils/storyImport';

const donorStory = {
  id: 'my-story',
  title: 'My story',
  steps: [
    {
      id: 'step-1',
      viewport: { fitLayer: 'layer-a' },
      activeLayers: [{ id: 'layer-a', opacity: 0.5 }, { id: 'layer-b' }],
      baseLayer: 'base-osm',
      panelState: { focusLayer: 'layer-b' },
    },
  ],
};

describe('storyImport', () => {
  it('collects every referenced layer id', () => {
    expect(collectStoryLayerRefs(donorStory).sort()).toEqual([
      'base-osm',
      'layer-a',
      'layer-b',
    ]);
  });

  it('remaps references to the newly minted ids', () => {
    const map = new Map([
      ['layer-a', 'layer-a-1'],
      ['layer-b', 'layer-b-1'],
      ['base-osm', 'base-osm-1'],
    ]);
    const { story, dropped } = remapStoryLayerRefs(donorStory, map);
    const step: any = (story as any).steps[0];
    expect(dropped).toBe(0);
    expect(step.activeLayers.map((l: any) => l.id)).toEqual(['layer-a-1', 'layer-b-1']);
    expect(step.activeLayers[0].opacity).toBe(0.5);
    expect(step.baseLayer).toBe('base-osm-1');
    expect(step.panelState.focusLayer).toBe('layer-b-1');
    expect(step.viewport.fitLayer).toBe('layer-a-1');
  });

  it('drops references that were not imported', () => {
    const map = new Map([['layer-a', 'layer-a-1']]);
    const { story, dropped } = remapStoryLayerRefs(donorStory, map);
    const step: any = (story as any).steps[0];
    expect(step.activeLayers.map((l: any) => l.id)).toEqual(['layer-a-1']);
    expect(step.baseLayer).toBeUndefined();
    expect(step.panelState.focusLayer).toBeUndefined();
    expect(dropped).toBe(3);
  });

  it('does not mutate the donor story', () => {
    remapStoryLayerRefs(donorStory, new Map());
    expect(donorStory.steps[0].activeLayers).toHaveLength(2);
  });

  it('de-duplicates ids and titles', () => {
    expect(uniqueStoryId('my-story', ['my-story'])).toBe('my-story-2');
    expect(uniqueStoryId('my-story', ['my-story', 'my-story-2'])).toBe('my-story-3');
    expect(uniqueStoryTitle('My story', ['My story'])).toBe('My story (2)');
  });
});
