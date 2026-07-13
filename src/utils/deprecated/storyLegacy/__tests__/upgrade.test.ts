import { describe, it, expect } from 'vitest';
import {
  upgradeLegacyStep,
  upgradeLegacyStory,
  upgradeLegacyStories,
} from '@/utils/deprecated/storyLegacy/upgrade';
import type { Story, StoryStepLegacy, StoryStepV2 } from '@/types/story';

const legacyStep: StoryStepLegacy = {
  id: 'overview',
  title: 'Regional overview',
  description: '## Austria',
  focusLayer: 'austria-solar-annual',
  expandPanels: ['styles', 'filters', 'unknown-key'],
  layers: { active: ['austria-solar-annual', 'population'] },
  viewport: { zoom: 7, center: [14.5, 47.5], duration: 500 },
  controls: [
    {
      layer: 'austria-solar-annual',
      opacity: 0.8,
      blend: false,
      constraints: [{ label: 'Elevation', lower: 0, upper: 4000 }],
    },
    // control for a layer NOT in active — still preserved as active layer
    { layer: 'other-thing', opacity: 0.5 },
  ],
};

const legacyStory: Story = {
  id: 'austria',
  title: 'Austria',
  description: 'Intro',
  isActive: true,
  steps: [legacyStep],
};

describe('upgradeLegacyStep', () => {
  it('moves title/description into content', () => {
    const v2 = upgradeLegacyStep(legacyStep);
    expect(v2.content?.title).toBe('Regional overview');
    expect(v2.content?.description).toContain('Austria');
  });

  it('merges layers.active + controls into activeLayers preserving order', () => {
    const v2 = upgradeLegacyStep(legacyStep);
    expect(v2.activeLayers.map((l) => l.id)).toEqual([
      'austria-solar-annual',
      'population',
      'other-thing',
    ]);
    const first = v2.activeLayers[0];
    expect(first.opacity).toBe(0.8);
    expect(first.blend).toBe(false);
    expect(first.constraints).toHaveLength(1);
  });

  it('lifts focusLayer and expandPanels into panelState', () => {
    const v2 = upgradeLegacyStep(legacyStep);
    expect(v2.panelState?.focusLayer).toBe('austria-solar-annual');
    expect(v2.panelState?.controls?.styles?.expanded).toBe(true);
    expect(v2.panelState?.controls?.filters?.expanded).toBe(true);
    // unknown expandPanels key is dropped silently
    expect((v2.panelState?.controls as any)?.['unknown-key']).toBeUndefined();
  });

  it('omits panelState when there is no focus and no expanded panels', () => {
    const bare: StoryStepLegacy = {
      id: 'x',
      title: 'X',
      layers: { active: ['a'] },
      viewport: { fitLayer: 'a' },
    };
    const v2 = upgradeLegacyStep(bare);
    expect(v2.panelState).toBeUndefined();
  });

  it('is idempotent on v2 input', () => {
    const v2: StoryStepV2 = {
      id: 'x',
      viewport: { fitLayer: 'a' },
      activeLayers: [{ id: 'a' }],
    };
    const again = upgradeLegacyStep(v2);
    expect(again).toEqual(v2);
    expect(again).not.toBe(v2);
  });
});

describe('upgradeLegacyStory', () => {
  it('preserves story-level fields and upgrades every step', () => {
    const v2 = upgradeLegacyStory(legacyStory);
    expect(v2.id).toBe('austria');
    expect(v2.isActive).toBe(true);
    expect(v2.steps).toHaveLength(1);
    expect(v2.steps[0].activeLayers[0].id).toBe('austria-solar-annual');
  });
});

describe('upgradeLegacyStories', () => {
  it('handles undefined and empty inputs', () => {
    expect(upgradeLegacyStories(undefined)).toEqual([]);
    expect(upgradeLegacyStories([])).toEqual([]);
  });
});
