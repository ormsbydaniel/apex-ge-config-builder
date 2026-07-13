import { describe, it, expect } from 'vitest';
import {
  StorySchema,
  StoryStepSchema,
  StoryStepV2Schema,
  StoryStepLegacySchema,
  StoryViewportSchema,
  StoryConstraintSelectionSchema,
  StoryPanelStateSchema,
} from '@/schemas/storySchema';
import { ConfigurationSchema } from '@/schemas/configSchema';

const legacyStory = {
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
          constraints: [{ label: 'Elevation', lower: 0, upper: 4000 }],
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

const v2Story = {
  id: 'v2-example',
  title: 'v2 Example',
  thumbnail: '/assets/stories/x.svg',
  steps: [
    {
      id: 'intro',
      content: { title: 'Intro', description: '# Hello' },
      autoAdvance: 8000,
      viewport: {
        extent: [9.5, 46.3, 17.2, 49.0],
        projection: 'EPSG:4326',
        maxZoom: 12,
        duration: 800,
      },
      activeLayers: [
        {
          id: 'austria-solar-annual',
          opacity: 0.85,
          blend: false,
          date: 'latest',
          constraints: [{ label: 'Elevation', lower: 0, upper: 4000 }],
        },
      ],
      panelState: {
        focusLayer: 'austria-solar-annual',
        controls: {
          styles: { expanded: true, disabled: true },
          filters: { expanded: true, disabled: true },
        },
        tab: { id: 'charts', activeChart: 'Carbon Dioxide' },
      },
    },
  ],
};

describe('StorySchema', () => {
  it('accepts the legacy story shape (backwards compatible)', () => {
    expect(StorySchema.safeParse(legacyStory).success).toBe(true);
  });

  it('accepts the v2 story shape', () => {
    expect(StorySchema.safeParse(v2Story).success).toBe(true);
  });

  it('accepts thumbnail on story root', () => {
    const parsed = StorySchema.parse(v2Story);
    expect(parsed.thumbnail).toBe('/assets/stories/x.svg');
  });

  it('accepts all three viewport modes', () => {
    expect(StoryViewportSchema.safeParse({ zoom: 7, center: [14.5, 47.5] }).success).toBe(true);
    expect(StoryViewportSchema.safeParse({ fitLayer: 'foo', duration: 500 }).success).toBe(true);
    expect(
      StoryViewportSchema.safeParse({ extent: [0, 0, 1, 1], maxZoom: 10 }).success,
    ).toBe(true);
    expect(StoryViewportSchema.safeParse({}).success).toBe(false);
  });

  it('rejects a constraint selection with neither range nor values', () => {
    expect(StoryConstraintSelectionSchema.safeParse({ label: 'X' }).success).toBe(false);
  });

  it('rejects bandIndex on a constraint selection', () => {
    const bad = StoryConstraintSelectionSchema.safeParse({
      label: 'X',
      lower: 0,
      upper: 1,
      bandIndex: 3,
    });
    expect(bad.success).toBe(false);
  });

  it('requires at least one step', () => {
    expect(StorySchema.safeParse({ id: 'x', title: 'X', steps: [] }).success).toBe(false);
  });

  it('accepts and preserves isActive on a story', () => {
    const parsed = StorySchema.parse({ ...legacyStory, isActive: true });
    expect(parsed.isActive).toBe(true);
  });

  it('accepts panelState with recognised tab id and rejects unknown tab id', () => {
    expect(
      StoryPanelStateSchema.safeParse({ tab: { id: 'overview' } }).success,
    ).toBe(true);
    expect(
      StoryPanelStateSchema.safeParse({ tab: { id: 'nope' } }).success,
    ).toBe(false);
  });

  it('StoryStepSchema discriminates legacy vs v2 shape', () => {
    expect(StoryStepLegacySchema.safeParse(legacyStory.steps[0]).success).toBe(true);
    expect(StoryStepV2Schema.safeParse(v2Story.steps[0]).success).toBe(true);
    expect(StoryStepSchema.safeParse(legacyStory.steps[0]).success).toBe(true);
    expect(StoryStepSchema.safeParse(v2Story.steps[0]).success).toBe(true);
    // Missing both shapes' required fields → rejected.
    expect(
      StoryStepSchema.safeParse({ id: 'x', viewport: { fitLayer: 'a' } }).success,
    ).toBe(false);
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

  it('accepts a config with legacy or v2 stories', () => {
    expect(
      ConfigurationSchema.safeParse({ ...baseConfig, stories: [legacyStory] }).success,
    ).toBe(true);
    expect(
      ConfigurationSchema.safeParse({ ...baseConfig, stories: [v2Story] }).success,
    ).toBe(true);
  });

  it('preserves stories through parse', () => {
    const parsed = ConfigurationSchema.parse({
      ...baseConfig,
      stories: [legacyStory, v2Story],
    });
    expect(parsed.stories).toHaveLength(2);
  });

  it('still accepts configs without stories', () => {
    expect(ConfigurationSchema.safeParse(baseConfig).success).toBe(true);
  });
});
