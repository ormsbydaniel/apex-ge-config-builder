import { describe, expect, it } from 'vitest';
import { fieldDetectionSources, mergeDetectedFields } from '../populateFieldDetails';

describe('populate field details', () => {
  it('only offers supported files and retains original positions for duplicate URLs', () => {
    const sources = [
      { url: 'same.geojson', format: 'GeoJSON', zIndex: 0 },
      { url: 'service', format: 'WFS', zIndex: 1 },
      { url: 'same.geojson', format: 'json', zIndex: 2 },
      { url: 'other.fgb', format: 'FlatGeoBuf', zIndex: 3 },
    ];
    expect(fieldDetectionSources(sources).map(({ index }) => index)).toEqual([0, 2, 3]);
  });

  it('appends detected fields without changing configured or hidden fields', () => {
    const merged = mergeDetectedFields({ hidden: null, existing: { label: 'Custom', order: 8, type: 'url' } }, [
      { name: 'existing', type: 'datetime' },
      { name: 'hidden', type: 'date' },
      { name: 'when', type: 'datetime' },
      { name: 'date', type: 'date' },
      { name: 'count', type: 'int' },
    ]);
    expect(merged).toEqual({
      hidden: null,
      existing: { label: 'Custom', order: 1, type: 'url' },
      when: { type: 'datetime', order: 2 },
      date: { type: 'date', order: 3 },
      count: { order: 4 },
    });
  });
});