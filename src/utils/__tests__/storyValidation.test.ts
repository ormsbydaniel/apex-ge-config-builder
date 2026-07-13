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

describe('validateStories — v2 shape', () => {
  const makeV2Story = (step: any): Story => ({
    id: 's1',
    title: 'S',
    steps: [
      {
        id: 'step1',
        viewport: { fitLayer: 'austria-solar-annual' },
        activeLayers: [{ id: 'austria-solar-annual' }],
        ...step,
      } as any,
    ],
  });

  it('produces no warnings for a valid v2 step covering all interactive constraints', () => {
    const stories = [
      makeV2Story({
        activeLayers: [
          {
            id: 'austria-solar-annual',
            opacity: 0.8,
            constraints: [
              { label: 'Elevation', lower: 0, upper: 4000 },
              { label: 'Altitudinal zones', values: [0, 1] },
            ],
          },
        ],
        panelState: {
          focusLayer: 'austria-solar-annual',
          tab: { id: 'overview' },
        },
      }),
    ];
    expect(validateStories(stories, [source]).size).toBe(0);
  });

  it('flags unknown active layer id in v2', () => {
    const stories = [makeV2Story({ activeLayers: [{ id: 'nope' }] })];
    const w = validateStories(stories, [source]).get(stepKey(0, 0))!;
    expect(w.some((x) => x.field === 'activeLayers[0].id')).toBe(true);
  });

  it('flags missing required interactive constraint coverage', () => {
    const stories = [
      makeV2Story({
        activeLayers: [
          {
            id: 'austria-solar-annual',
            constraints: [{ label: 'Elevation', lower: 0, upper: 100 }],
          },
        ],
      }),
    ];
    const w = validateStories(stories, [source]).get(stepKey(0, 0))!;
    expect(w.some((x) => x.kind === 'missing-required-constraint')).toBe(true);
  });

  it('flags focusLayer not present in activeLayers', () => {
    const stories = [
      makeV2Story({
        activeLayers: [
          {
            id: 'austria-solar-annual',
            constraints: [
              { label: 'Elevation', lower: 0, upper: 4000 },
              { label: 'Altitudinal zones', values: [0, 1] },
            ],
          },
        ],
        panelState: { focusLayer: 'austria-solar-annual-extra' },
      }),
    ];
    const w = validateStories(stories, [source]).get(stepKey(0, 0))!;
    // Not in sources at all → unknown-layer at panelState.focusLayer.
    expect(w.some((x) => x.field === 'panelState.focusLayer')).toBe(true);
  });

  it('flags rejected bandIndex on a v2 constraint selection', () => {
    const stories = [
      makeV2Story({
        activeLayers: [
          {
            id: 'austria-solar-annual',
            constraints: [
              { label: 'Elevation', lower: 0, upper: 4000, bandIndex: 3 } as any,
              { label: 'Altitudinal zones', values: [0, 1] },
            ],
          },
        ],
      }),
    ];
    const w = validateStories(stories, [source]).get(stepKey(0, 0))!;
    expect(w.some((x) => x.kind === 'rejected-band-index')).toBe(true);
  });
});


