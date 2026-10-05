import { describe, it, expect } from 'vitest';
import { buildIndexStyle, indexColorStops, indexRangePresets, matchIndexRecipe, resolveIndexBands, INDEX_PALETTES, recipeLegendStops, withRecipePalette } from '../indices';
import { DataSourceItemSchema } from '@/schemas/configSchema';

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

describe('recipe palettes', () => {
  it('has ordered absolute stops and labelled endpoints for all six supplied indices', () => {
    expect(Object.keys(INDEX_PALETTES).sort()).toEqual(['mndwi', 'nbr', 'ndbi', 'ndre', 'ndvi', 'ndwi']);
    for (const [id, palette] of Object.entries(INDEX_PALETTES)) {
      expect(palette.stops[0].value).toBe(palette.displayMin);
      expect(palette.stops.at(-1)?.value).toBe(palette.displayMax);
      expect(palette.stops.length).toBeGreaterThanOrEqual(6);
      for (let i = 0; i < palette.stops.length; i++) {
        expect(palette.stops[i].color).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(palette.stops[i].meaning.length).toBeGreaterThan(0);
        if (i) expect(palette.stops[i].value).toBeGreaterThan(palette.stops[i - 1].value);
      }
      const cfg = withRecipePalette({ recipe: id as keyof typeof INDEX_PALETTES, bandA: 1, bandB: 2, colormap: 'viridis', min: palette.displayMin, max: palette.displayMax, paletteMode: 'recipe' });
      const expression = buildIndexStyle(cfg).color.at(-1) as unknown[];
      expect(expression[0]).toBe('interpolate');
      expect(expression[3]).toBe(palette.displayMin);
      expect(expression.at(-2)).toBe(palette.displayMax);
      expect(expression[4]).toEqual(palette.stops[0].color.match(/\w\w/g)?.map((hex) => parseInt(hex, 16)).concat(1));
      expect(cfg.legendStops).toEqual(recipeLegendStops(cfg.recipe));
      const parsed = DataSourceItemSchema.parse({ format: 'cog', zIndex: 0, spectralIndex: cfg });
      expect(parsed.spectralIndex?.legendStops).toEqual(palette.stops);
    }
  });
  it('keeps legacy styles generic and omits false legend labels on override', () => {
    const cfg = { recipe: 'ndwi' as const, bandA: 3, bandB: 8, colormap: 'rdbu', reverse: true, min: -0.5, max: 0.5 };
    expect(withRecipePalette(cfg).legendStops).toBeUndefined();
    expect(buildIndexStyle(cfg)).toEqual(buildIndexStyle(withRecipePalette(cfg)));
    expect(withRecipePalette({ ...cfg, legendStops: recipeLegendStops('ndwi') }).legendStops).toBeUndefined();
  });
  it('keeps the visibility mask separate from absolute colour stops', () => {
    const cfg = withRecipePalette({ recipe: 'ndwi', bandA: 3, bandB: 8, colormap: 'rdbu', min: -0.5, max: 0.5, paletteMode: 'recipe', visibleMin: 0 });
    const expression = buildIndexStyle(cfg).color;
    expect(expression[3]).toEqual(['<', ['/', ['-', ['band', 1], ['band', 2]], ['+', ['band', 1], ['band', 2]]], 0]);
    expect((expression.at(-1) as unknown[])[3]).toBe(-0.5);
  });
});
