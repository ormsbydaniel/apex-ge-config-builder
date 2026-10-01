import { describe, it, expect } from 'vitest';
import {
  equalIntervalBreaks,
  quantileBreaks,
  summariseProperties,
  canSampleSource,
  summariseGeometries,
  MAX_CATEGORIES,
} from '../sampleSourceData';

describe('summariseProperties', () => {
  const rows = [
    { landuse: 'Forest', area: 10, name: 'A' },
    { landuse: 'Forest', area: 20, name: 'B' },
    { landuse: 'Urban', area: 5, name: 'C' },
    { landuse: 'Water', area: null, name: 'D' },
  ];

  it('collects unique categories ordered by frequency', () => {
    const landuse = summariseProperties(rows).find(f => f.name === 'landuse');
    expect(landuse?.type).toBe('string');
    expect(landuse?.categories?.map(c => c.value)).toEqual(['Forest', 'Urban', 'Water']);
    expect(landuse?.categories?.[0].count).toBe(2);
  });

  it('collects numeric range and ignores nulls', () => {
    const area = summariseProperties(rows).find(f => f.name === 'area');
    expect(area?.type).toBe('number');
    expect(area?.numeric).toMatchObject({ min: 5, max: 20 });
    expect(area?.numeric?.values).toEqual([5, 10, 20]);
  });

  it('truncates very high-cardinality fields', () => {
    const many = Array.from({ length: MAX_CATEGORIES + 5 }, (_, i) => ({ id: `v${i}` }));
    const field = summariseProperties(many).find(f => f.name === 'id');
    expect(field?.categories).toHaveLength(MAX_CATEGORIES);
    expect(field?.categoriesTruncated).toBe(true);
  });

  it('returns fields sorted by name', () => {
    expect(summariseProperties(rows).map(f => f.name)).toEqual(['area', 'landuse', 'name']);
  });

  it('tolerates empty input', () => {
    expect(summariseProperties([])).toEqual([]);
  });
});

describe('classification breaks', () => {
  it('splits a range into equal intervals', () => {
    expect(equalIntervalBreaks(0, 100, 5)).toEqual([0, 25, 50, 75, 100]);
  });

  it('handles a flat range', () => {
    expect(equalIntervalBreaks(7, 7, 4)).toEqual([7]);
  });

  it('computes quantile breaks spanning the observed values', () => {
    const breaks = quantileBreaks([1, 2, 3, 4, 100], 3);
    expect(breaks[0]).toBe(1);
    expect(breaks[breaks.length - 1]).toBe(100);
  });
});

describe('canSampleSource', () => {
  it('accepts vector formats and rejects raster ones', () => {
    expect(canSampleSource('GeoJSON')).toBe(true);
    expect(canSampleSource('flatgeobuf')).toBe(true);
    expect(canSampleSource('fgb')).toBe(true);
    expect(canSampleSource('cog')).toBe(false);
    expect(canSampleSource('wms')).toBe(false);
  });
});

describe('summariseGeometries', () => {
  it('detects a single type and folds Multi* types', () => {
    const g = summariseGeometries(['Polygon', 'MultiPolygon']);
    expect(g.dominant).toBe('polygon');
    expect(g.counts.polygon).toBe(2);
  });
  it('picks the dominant type for mixed data', () => {
    const g = summariseGeometries(['Point', 'LineString', 'MultiLineString']);
    expect(g.dominant).toBe('line');
    expect(g.counts).toEqual({ polygon: 0, line: 2, point: 1 });
  });
  it('returns null when nothing is recognised', () => {
    expect(summariseGeometries([undefined, 'GeometryCollection']).dominant).toBeNull();
  });
});

describe('numeric categories', () => {
  it('lists distinct numeric values in ascending order', async () => {
    const { summariseProperties } = await import('../sampleSourceData');
    const fields = summariseProperties([{ voltage: 380 }, { voltage: 220 }, { voltage: 380 }] as never);
    const v = fields.find((f) => f.name === 'voltage')!;
    expect(v.categories!.map((c) => c.value)).toEqual(['220', '380']);
  });
});
