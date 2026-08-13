import { describe, it, expect } from 'vitest';
import { legendToStyleSuggestion, legendToCategories } from '@/utils/catalogueLegend';
import { generateColorRamp } from '@/utils/colormapUtils';
import { CatalogueLegend } from '@/types/service';

const toHex = (c: [number, number, number]) =>
  `#${c.map(v => v.toString(16).padStart(2, '0')).join('')}`;

describe('catalogueLegend', () => {
  it('converts a discrete legend to categories', () => {
    const legend: CatalogueLegend = {
      type: 'discrete',
      entries: [
        { value: 0, color: '#EDF8FB' },
        { value: 1, color: '#B3CDE3' },
        { value: 2, color: '#8C96C6', label: 'Cloud' },
      ],
    };
    const suggestion = legendToStyleSuggestion(legend);
    expect(suggestion?.kind).toBe('categories');
    expect(legendToCategories(legend)).toEqual([
      { value: 0, color: '#EDF8FB', label: '0' },
      { value: 1, color: '#B3CDE3', label: '1' },
      { value: 2, color: '#8C96C6', label: 'Cloud' },
    ]);
  });

  it('uses the colormapName hint for continuous legends', () => {
    const suggestion = legendToStyleSuggestion({
      type: 'continuous',
      min: 0,
      max: 1,
      steps: 10,
      colormapName: 'magma',
      reverse: true,
      units: 'fraction',
      entries: [
        { value: 0, color: '#FCFDBF' },
        { value: 0.5, color: '#F1605D' },
        { value: 1, color: '#000004' },
      ],
    });
    expect(suggestion).toMatchObject({
      kind: 'colormap',
      units: 'fraction',
      colormap: { name: 'magma', min: 0, max: 1, steps: 10, reverse: true },
    });
  });

  it('matches an unnamed preset ramp by colour', () => {
    const ramp = generateColorRamp('viridis', 12, false);
    const suggestion = legendToStyleSuggestion({
      type: 'continuous',
      min: 0,
      max: 100,
      entries: ramp.map((c, i) => ({ value: (i / 11) * 100, color: toHex(c) })),
    });
    expect(suggestion).toMatchObject({ kind: 'colormap', matched: true });
  });

  it('falls back to a two-stop gradient for bespoke ramps', () => {
    const suggestion = legendToStyleSuggestion({
      type: 'continuous',
      min: 0,
      max: 5,
      entries: [
        { value: 0, color: '#123456' },
        { value: 2.5, color: '#654321' },
        { value: 5, color: '#0abc99' },
      ],
    });
    expect(suggestion).toMatchObject({
      kind: 'gradient',
      min: 0,
      max: 5,
      startColor: '#123456',
      endColor: '#0ABC99',
    });
  });

  it('excludes no-data sentinels from the ramp', () => {
    const suggestion = legendToStyleSuggestion({
      type: 'continuous',
      min: 0,
      max: 1,
      noData: [{ value: -1, color: '#FFFFFF' }],
      entries: [
        { value: -1, color: '#FFFFFF' },
        { value: 0, color: '#123456' },
        { value: 1, color: '#0ABC99' },
      ],
    });
    expect(suggestion).toMatchObject({ kind: 'gradient', startColor: '#123456' });
  });
});
