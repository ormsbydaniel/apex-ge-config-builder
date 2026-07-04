import { describe, it, expect } from 'vitest';
import { validateStories, stepKey } from '@/utils/storyValidation';
import { DataSource, Story } from '@/types/config';

const source: DataSource = {
  id: 'austria-solar-annual',
  name: 'austria-solar-annual',
  isActive: true,
  data: [{ url: 'x', format: 'cog', zIndex: 0 }],
  meta: {
    description: '',
    attribution: { text: '' },
    categories: [],
    constraints: [
      {
        url: 'x',
        format: 'cog',
        label: 'Elevation',
        type: 'continuous',
        interactive: true,
        min: 0,
        max: 4000,
      },
      {
        url: 'x',
        format: 'cog',
        label: 'Altitudinal zones',
        type: 'categorical',
        interactive: true,
        constrainTo: [
          { label: 'low', value: 0 },
          { label: 'mid', value: 1 },
        ] as any,
      },
    ],
  } as any,
  // In real config, constraints live at source root too. The validator reads
  // source.constraints; provide same shape here.
  constraints: [
    {
      url: 'x',
      format: 'cog',
      label: 'Elevation',
      type: 'continuous',
      interactive: true,
      min: 0,
      max: 4000,
    },
    {
      url: 'x',
      format: 'cog',
      label: 'Altitudinal zones',
      type: 'categorical',
      interactive: true,
      constrainTo: [
        { label: 'low', value: 0 },
        { label: 'mid', value: 1 },
      ] as any,
    },
  ],
} as any;

const makeStory = (step: any): Story => ({
  id: 's1',
  title: 'Story 1',
  steps: [
    {
      id: 'step1',
      title: 'Step 1',
      layers: { active: [] },
      viewport: { fitLayer: 'austria-solar-annual' },
      ...step,
    },
  ],
});

describe('validateStories', () => {
  it('produces no warnings for a valid step', () => {
    const stories = [
      makeStory({
        focusLayer: 'austria-solar-annual',
        layers: { active: ['austria-solar-annual'] },
        controls: [
          {
            layer: 'austria-solar-annual',
            constraints: [
              { label: 'Elevation', lower: 0, upper: 4000 },
              { label: 'Altitudinal zones', values: [0, 1] },
            ],
          },
        ],
      }),
    ];
    const warnings = validateStories(stories, [source]);
    expect(warnings.size).toBe(0);
  });

  it('flags unknown focus layer, active layer, and control layer', () => {
    const stories = [
      makeStory({
        focusLayer: 'nope',
        layers: { active: ['nope-2'] },
        controls: [{ layer: 'nope-3' }],
      }),
    ];
    const warnings = validateStories(stories, [source]);
    const w = warnings.get(stepKey(0, 0))!;
    expect(w.filter((x) => x.kind === 'unknown-layer')).toHaveLength(3);
  });

  it('flags unknown constraint label on a known layer', () => {
    const stories = [
      makeStory({
        controls: [
          {
            layer: 'austria-solar-annual',
            constraints: [{ label: 'Nope', lower: 0, upper: 1 }],
          },
        ],
      }),
    ];
    const w = validateStories(stories, [source]).get(stepKey(0, 0))!;
    expect(w.some((x) => x.kind === 'unknown-constraint')).toBe(true);
  });

  it('flags selection/type mismatch (values on continuous)', () => {
    const stories = [
      makeStory({
        controls: [
          {
            layer: 'austria-solar-annual',
            constraints: [{ label: 'Elevation', values: [1, 2] }],
          },
        ],
      }),
    ];
    const w = validateStories(stories, [source]).get(stepKey(0, 0))!;
    expect(w.some((x) => x.kind === 'selection-type-mismatch')).toBe(true);
  });

  it('flags selection/type mismatch (range on categorical)', () => {
    const stories = [
      makeStory({
        controls: [
          {
            layer: 'austria-solar-annual',
            constraints: [{ label: 'Altitudinal zones', lower: 0, upper: 1 }],
          },
        ],
      }),
    ];
    const w = validateStories(stories, [source]).get(stepKey(0, 0))!;
    expect(w.some((x) => x.kind === 'selection-type-mismatch')).toBe(true);
  });

  it('matches layer references by slug of source name', () => {
    const src: DataSource = { ...source, id: 'austria-solar-annual', name: 'Austria Solar Annual' } as any;
    const stories = [
      makeStory({
        focusLayer: 'austria-solar-annual',
        layers: { active: ['austria-solar-annual'] },
      }),
    ];
    const warnings = validateStories(stories, [src]);
    expect(warnings.size).toBe(0);
  });

  it('matches layer references by explicit source id', () => {
    const src: DataSource = { ...source, id: 'solar-2024', name: 'Solar' } as any;
    const stories = [
      makeStory({
        focusLayer: 'solar-2024',
        layers: { active: ['solar-2024'] },
        viewport: { fitLayer: 'solar-2024' },
        controls: [{ layer: 'solar-2024' }],
      }),
    ];
    const warnings = validateStories(stories, [src]);
    expect(warnings.size).toBe(0);
  });
});

