import { describe, expect, it } from 'vitest';
import { applyCompositeStyle, applyComputedStyle, visualisationName } from '../styleScope';
import type { ComputedCompositeConfig } from '../computed';
import { copyVisualisation, stripVisualisation } from '../perDataset';
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

  it('styles mapped STAC COG assets while preserving their STAC identity', () => {
    const stacCog = { format: 'stac', url: 'https://example.org/items', zIndex: 0, assets: ['visual'], assetFormats: { visual: 'cog' } } as DataSourceItem;
    const stacVector = { format: 'stac', url: 'https://example.org/vector-items', zIndex: 1, assets: ['data'], assetFormats: { data: 'flatgeobuf' } } as DataSourceItem;
    const result = applyCompositeStyle([stacCog, stacVector], 0, [4, 3, 2], true, () => ({ variables: { rMin: 1 } }));
    expect(result[0]).toMatchObject({ format: 'stac', url: 'https://example.org/items', assets: ['visual'], assetFormats: { visual: 'cog' }, convertToRGB: true, bands: [4, 3, 2] });
    expect(result[1]).toBe(stacVector);
  });
});
import { applyIndexStyle } from '../styleScope';
describe('computed style scope', () => {
  const cfg: ComputedCompositeConfig = { recipe: 'barren-soil', bands: [1, 3, 7, 9], inputScale: 'dn' };
  it('switches a single dataset and keeps peers independent', () => {
    const out = applyComputedStyle(items, 0, cfg, false);
    expect(out[0]).toMatchObject({ computedComposite: cfg, bands: cfg.bands, normalize: false });
    expect(out[0].convertToRGB).toBeUndefined();
    expect(out[2].styleSource).toBe('own');
    expect(out[1]).toBe(items[1]);
    expect(visualisationName(out[0], 10)).toBe('Barren soil (Computed)');
  });
  it('copies and strips metadata together with rendered expressions', () => {
    const out = applyComputedStyle(items, 1, cfg, true);
    expect(out.every((d) => d.computedComposite && !d.styleSource)).toBe(true);
    expect(copyVisualisation(out[0], items[1]).computedComposite).toEqual(cfg);
    expect(stripVisualisation(out[0]).computedComposite).toBeUndefined();
    expect(applyCompositeStyle(out, 0, [3, 2, 1], true, () => ({ variables: { rMin: 0, rMax: 10000 } })).every((d) => !d.computedComposite && d.convertToRGB)).toBe(true);
    const index = { recipe: 'ndvi' as const, bandA: 7, bandB: 3, colormap: 'greens', min: -1, max: 1 };
    expect(applyIndexStyle(out, 1, index, false)[1].computedComposite).toBeUndefined();
  });
});
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
    expect(styled[1].spectralIndex?.legendStops?.[0].label).toBe('Very low vegetation response');
    const all = applyIndexStyle(styled, 1, { ...cfg, paletteMode: 'recipe', recipe: 'ndwi' }, true);
    expect(all.every((item) => item.spectralIndex?.legendStops?.[0].label === 'Dry land')).toBe(true);
    expect(all.every((item) => item.spectralIndex?.recipe === 'ndwi')).toBe(true);
  });
});
