import { describe, it, expect } from 'vitest';
import {
  StorySchema,
  StoryStepSchema,
  StoryViewportSchema,
  StoryConstraintSelectionSchema,
} from '@/schemas/storySchema';
import { ConfigurationSchema } from '@/schemas/configSchema';

const exampleStory = {
  id: 'austria-solar-intro',
  title: 'Austria Solar Potential',
  description: 'Explore **annual solar power potential** across Austria.',
  steps: [
    {
      id: 'overview',
      title: 'Regional overview',
      description: '## Austria at a glance',
      focusLayer: 'austria-solar-annual',
      expandPanels: [],
      layers: { active: ['austria-solar-annual'] },
      viewport: { zoom: 7, center: [14.5, 47.5], duration: 500 },
      controls: [
        {
          layer: 'austria-solar-annual',
          opacity: 0.8,
          blend: false,
          constraints: [
            { label: 'Elevation', lower: 0, upper: 4000 },
            {
              label: 'Altitudinal zones',
              values: ['0_1000', '1001_2000', '2001_3000', '3001_4000'],
            },
            { label: 'Land Cover', values: [10, 20, 30] },
          ],
        },
      ],
    },
    {
      id: 'fit',
      title: 'Fit to layer',
      layers: { active: ['austria-solar-annual'] },
      viewport: { fitLayer: 'austria-solar-annual' },
    },
  ],
};

describe('StorySchema', () => {
  it('accepts the example story shape', () => {
    const parsed = StorySchema.safeParse(exampleStory);
    expect(parsed.success).toBe(true);
  });

  it('accepts either zoom+center or fitLayer viewport', () => {
    expect(StoryViewportSchema.safeParse({ zoom: 7, center: [14.5, 47.5] }).success).toBe(true);
    expect(StoryViewportSchema.safeParse({ fitLayer: 'foo' }).success).toBe(true);
    expect(StoryViewportSchema.safeParse({ zoom: 7 }).success).toBe(false);
    expect(StoryViewportSchema.safeParse({}).success).toBe(false);
  });

  it('rejects a constraint selection with neither range nor values', () => {
    const bad = StoryConstraintSelectionSchema.safeParse({ label: 'X' });
    expect(bad.success).toBe(false);
  });

  it('accepts both string and numeric categorical values', () => {
    expect(
      StoryConstraintSelectionSchema.safeParse({ label: 'A', values: ['a', 'b'] }).success,
    ).toBe(true);
    expect(
      StoryConstraintSelectionSchema.safeParse({ label: 'A', values: [1, 2] }).success,
    ).toBe(true);
  });

  it('requires at least one step', () => {
    const parsed = StorySchema.safeParse({ id: 'x', title: 'X', steps: [] });
    expect(parsed.success).toBe(false);
  });

  it('requires id and title on step', () => {
    const parsed = StoryStepSchema.safeParse({
      layers: { active: [] },
      viewport: { fitLayer: 'a' },
    });
    expect(parsed.success).toBe(false);
  });

  it('accepts and preserves isActive on a story', () => {
    const parsed = StorySchema.parse({ ...exampleStory, isActive: true });
    expect(parsed.isActive).toBe(true);
  });

  it('accepts a story without isActive (backwards compatible)', () => {
    const parsed = StorySchema.safeParse(exampleStory);
    expect(parsed.success).toBe(true);
  });
});

describe('ConfigurationSchema stories field', () => {
  const baseConfig = {
    layout: { navigation: { logo: '/l.png', title: 'T' } },
    interfaceGroups: [],
    exclusivitySets: [],
    services: [],
    sources: [],
  };

  it('accepts a config with stories', () => {
    const parsed = ConfigurationSchema.safeParse({ ...baseConfig, stories: [exampleStory] });
    expect(parsed.success).toBe(true);
  });

  it('preserves stories through parse (does not strip them)', () => {
    const parsed = ConfigurationSchema.parse({ ...baseConfig, stories: [exampleStory] });
    expect(parsed.stories).toBeDefined();
    expect(parsed.stories?.[0].id).toBe('austria-solar-intro');
    expect(parsed.stories?.[0].steps).toHaveLength(2);
  });

  it('still accepts configs without stories', () => {
    const parsed = ConfigurationSchema.safeParse(baseConfig);
    expect(parsed.success).toBe(true);
  });
});
