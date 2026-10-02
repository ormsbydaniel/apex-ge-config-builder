import { describe, expect, it } from 'vitest';
import { applyCompositeStyle, visualisationName } from '../styleScope';
import type { DataSourceItem } from '@/types/dataSource';

const items = [
  { format: 'cog', url: 'first.tif', convertToRGB: true, bands: [3, 2, 1], style: { variables: { rMin: 10 } } },
  { format: 'cog', url: 'second.tif', convertToRGB: true, bands: [9, 7, 1], styleSource: 'own', style: { variables: { rMin: 20 } } },
  { format: 'cog', url: 'third.tif', convertToRGB: true, bands: [3, 2, 1], style: { variables: { rMin: 30 } } },
] as DataSourceItem[];

describe('composite style scope', () => {
  it('changes one dataset only without replacing other visualisations or stretch', () => {
    const result = applyCompositeStyle(items, 1, [10, 9, 3], false, (item) => item.style);
    expect(result[0]).toBe(items[0]);
    expect(result[1]).toMatchObject({ bands: [10, 9, 3], styleSource: 'own', style: { variables: { rMin: 20 } } });
    expect(result[2]).toBe(items[2]);
  });

  it('changes all recipes while retaining each range and own marker', () => {
    const result = applyCompositeStyle(items, 0, [9, 7, 1], true, (item) => item.style);
    expect(result.map((x) => x.bands)).toEqual([[9, 7, 1], [9, 7, 1], [9, 7, 1]]);
    expect(result.map((x) => (x.style as any).variables.rMin)).toEqual([10, 20, 30]);
    expect(result[1].styleSource).toBe('own');
  });

  it('keeps former same-as-first peers independent when only first recipe changes', () => {
    const result = applyCompositeStyle(items, 0, [9, 7, 1], false, (item) => item.style);
    expect(result[2]).toMatchObject({ bands: [3, 2, 1], styleSource: 'own' });
  });

  it('labels saved composite choices', () => {
    expect(visualisationName(items[0], 10)).toBe('Natural colour');
    expect(visualisationName(items[1], 10)).toBe('Agriculture');
  });
});