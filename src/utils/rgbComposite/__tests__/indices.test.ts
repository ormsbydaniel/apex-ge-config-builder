import { describe, it, expect } from 'vitest';
import { buildIndexStyle, indexColorStops, indexRangePresets, matchIndexRecipe, resolveIndexBands } from '../indices';

describe('indexRangePresets', () => {
  it('gives each recipe its own contextual presets', () => {
    expect(indexRangePresets('ndvi').map((p) => p.label)).toContain('Vegetation only');
    expect(indexRangePresets('ndwi').map((p) => p.label)).toContain('Open water');
    expect(indexRangePresets('mndwi').map((p) => p.label)).toContain('Open water');
    expect(indexRangePresets('ndbi').map((p) => p.label)).toContain('Urban / built-up');
    expect(indexRangePresets('nbr').map((p) => p.label)).toContain('Burn scars');
    expect(indexRangePresets('ndre').map((p) => p.label)).toContain('Dense canopy');
    expect(indexRangePresets('ndwi').map((p) => p.label)).not.toContain('Vegetation only');
  });
  it('task presets keep the ramp centred and mask via the visible range', () => {
    const water = indexRangePresets('ndwi').find((p) => p.label === 'Open water')!;
    expect([water.min, water.max, water.visibleMin, water.visibleMax]).toEqual([-0.5, 0.5, 0, 1]);
  });
  it('falls back to the generic pair for the custom index', () => {
    expect(indexRangePresets('custom-index').map((p) => p.label)).toEqual(['Full range', 'Positive only']);
  });
});

describe('resolveIndexBands', () => {
  it('resolves Sentinel-2 ARD (10 bands)', () => {
    expect(resolveIndexBands('ndvi', 10)).toEqual([7, 3]);
    expect(resolveIndexBands('nbr', 10)).toEqual([7, 10]);
    expect(resolveIndexBands('ndre', 10)).toEqual([7, 4]);
  });
  it('resolves L2A and Landsat', () => {
    expect(resolveIndexBands('mndwi', 12)).toEqual([3, 11]);
    expect(resolveIndexBands('ndbi', 7)).toEqual([6, 5]);
    expect(resolveIndexBands('ndre', 7)).toBeNull();
  });
  it('prefers band labels', () => {
    expect(resolveIndexBands('ndvi', 4, ['B02', 'B03', 'B04', 'B08'])).toEqual([4, 3]);
  });
  it('custom has no bands; unknown sensor yields null', () => {
    expect(resolveIndexBands('custom-index', 12)).toBeNull();
    expect(resolveIndexBands('ndvi', 5)).toBeNull();
  });
  it('matches recipe from bands', () => {
    expect(matchIndexRecipe([8, 4], 12)).toBe('ndvi');
    expect(matchIndexRecipe([1, 2], 12)).toBe('custom-index');
  });
});

describe('buildIndexStyle', () => {
  it('guards zero sums and uses ascending stops within range', () => {
    const style = buildIndexStyle({ recipe: 'ndvi', bandA: 8, bandB: 4, colormap: 'greens', reverse: true, min: -0.1, max: 0.8 });
    expect(style.color[0]).toBe('case');
    // reads the remapped bands 1 and 2, never the absolute numbers
    const json = JSON.stringify(style);
    expect(json).toContain('["band",1]');
    expect(json).toContain('["band",2]');
    expect(json).not.toContain('["band",8]');
    const stops = indexColorStops('greens', true, -0.1, 0.8);
    expect(stops[0][0]).toBeCloseTo(-0.1);
    expect(stops[stops.length - 1][0]).toBeCloseTo(0.8);
    for (let i = 1; i < stops.length; i++) expect(stops[i][0]).toBeGreaterThan(stops[i - 1][0]);
    // reversed greens ends dark
    expect(stops[stops.length - 1][1].slice(0, 3)).toEqual([0, 68, 27]);
  });
});
