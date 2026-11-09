import { describe, expect, it } from 'vitest';
import { geojsonBbox, parseS2CloudlessYears, periodWithinExtent } from '../dataProbes';
import { migrateDraftStep } from '../wizardDraft';

describe('app wizard data probes', () => {
  it('derives EOX cloudless years from layer names', () => {
    expect(parseS2CloudlessYears(['s2cloudless_3857', 's2cloudless-2024_3857', 's2cloudless-2020_3857', 'osm_3857', 's2cloudless-2021'])).toEqual([
      '2016',
      '2020',
      '2024',
    ]);
  });

  it('checks periods against a STAC temporal extent', () => {
    const ext: [string, string | null] = ['2017-01-01', null];
    expect(periodWithinExtent('2016-06-01', '2016-08-31', ext)).toBe(false);
    expect(periodWithinExtent('2025-06-01', '2025-08-31', ext)).toBe(true);
    expect(periodWithinExtent('2025-06-01', '2025-08-31', ['2015-01-01', '2020-12-31'])).toBe(false);
  });

  it('computes a GeoJSON bbox from coordinates', () => {
    expect(
      geojsonBbox({ features: [{ geometry: { coordinates: [[1, 2], [3, -4]] } }, { geometry: { coordinates: [0, 5] } }] }),
    ).toEqual([0, -4, 3, 5]);
  });

  it('maps old wizard step indexes to the data-first order', () => {
    expect(migrateDraftStep({ step: 3 })).toBe(1); // old Data -> new Data
    expect(migrateDraftStep({ step: 1 })).toBe(2); // old Location
    expect(migrateDraftStep({ step: 4, version: 2 })).toBe(4);
  });
});
