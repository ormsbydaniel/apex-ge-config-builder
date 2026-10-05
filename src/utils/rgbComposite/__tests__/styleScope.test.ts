import { describe, expect, it } from 'vitest';
import { applyCompositeStyle, visualisationName } from '../styleScope';
import type { DataSourceItem } from '@/types/dataSource';

const items = [
  { format: 'cog', url: 'first.tif', zIndex: 0, convertToRGB: true, bands: [3, 2, 1], style: { variables: { rMin: 10 } } },
  { format: 'cog', url: 'second.tif', zIndex: 1, convertToRGB: true, bands: [9, 7, 1], styleSource: 'own', style: { variables: { rMin: 20 } } },
  { format: 'cog', url: 'third.tif', zIndex: 2, convertToRGB: true, bands: [3, 2, 1], style: { variables: { rMin: 30 } } },
] as DataSourceItem[];

describe('composite style scope', () => {
  it('changes one dataset only without replacing other visualisations or stretch', () => {
    const result = applyCompositeStyle(items, 1, [10, 9, 3], false, (item) => item.style);
    expect(result[0]).toBe(items[0]);
    expect(result[1]).toMatchObject({ bands: [10, 9, 3], styleSource: 'own', style: { variables: { rMin: 20 } } });
    expect(result[2]).toBe(items[2]);
  });

  it('changes all datasets, unifying ones marked own while keeping each range', () => {
    const result = applyCompositeStyle(items, 0, [9, 7, 1], true, (item) => item.style);
    expect(result.map((x) => x.bands)).toEqual([[9, 7, 1], [9, 7, 1], [9, 7, 1]]);
    expect(result.map((x) => (x.style as any).variables.rMin)).toEqual([10, 20, 30]);
    expect(result[1].styleSource).toBeUndefined();
  });

  it('keeps former same-as-first peers independent when only first recipe changes', () => {
    const result = applyCompositeStyle(items, 0, [9, 7, 1], false, (item) => item.style);
    expect(result[2]).toMatchObject({ bands: [3, 2, 1], styleSource: 'own' });
  });

  it('keeps follower ranges when only the first dataset stretch changes', () => {
    const result = applyCompositeStyle(items, 0, [3, 2, 1], false,
      () => ({ variables: { rMin: 42 } }), false, true);
    expect(result[0].style).toEqual({ variables: { rMin: 42 } });
    expect(result[2]).toMatchObject({ styleSource: 'own', style: { variables: { rMin: 30 } } });
  });

  it('labels saved composite choices', () => {
    expect(visualisationName(items[0], 10)).toBe('Natural colour');
    expect(visualisationName(items[1], 10)).toBe('Agriculture');
  });
});
import { applyIndexStyle } from '../styleScope';
describe('applyIndexStyle', () => {
  const cog = (url: string) => ({ format: 'cog', url, convertToRGB: true, bands: [9, 7, 1] } as any);
  const cfg = { recipe: 'ndre', bandA: 8, bandB: 5, colormap: 'viridis', reverse: false, min: 0, max: 0.8 } as any;
  it('switches one dataset from composite to index', () => {
    const out = applyIndexStyle([cog('a'), cog('b')], 1, cfg, false);
    expect(out[0].convertToRGB).toBe(true);
    expect(out[1].convertToRGB).toBeUndefined();
    expect(out[1].spectralIndex?.recipe).toBe('ndre');
    expect(out[1].bands).toEqual([8, 5]);
    expect(out[1].styleSource).toBe('own');
  });
  it('switches all datasets and clears markers', () => {
    const out = applyIndexStyle([cog('a'), { ...cog('b'), styleSource: 'own' }], 1, cfg, true);
    expect(out.every((d) => d.spectralIndex && !d.styleSource)).toBe(true);
  });
  it('exports labelled palette stops only to targeted datasets', () => {
    const styled = applyIndexStyle([cog('a'), cog('b')], 1, { ...cfg, paletteMode: 'recipe' }, false);
    expect(styled[0].spectralIndex).toBeUndefined();
    expect(styled[1].spectralIndex?.legendStops?.[0].meaning).toBe('Very low vegetation response');
    const all = applyIndexStyle(styled, 1, { ...cfg, paletteMode: 'recipe', recipe: 'ndwi' }, true);
    expect(all.every((item) => item.spectralIndex?.legendStops?.[0].meaning === 'Dry land')).toBe(true);
    expect(all.every((item) => item.spectralIndex?.recipe === 'ndwi')).toBe(true);
  });
});
