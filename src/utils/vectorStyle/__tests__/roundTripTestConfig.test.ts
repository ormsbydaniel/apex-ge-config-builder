import { describe, it, expect } from 'vitest';
import { fromFlatStyleArray } from '../fromFlatStyleArray';
import { toFlatStyleArray } from '../toFlatStyleArray';

// Styles taken from the "Vector datasets" test config.
const HV_GRID = [[{
  'stroke-color': ['case', ['==', ['get', 'current'], 'DC'], '#0070C0', ['>=', ['get', 'voltage'], 500], '#7030A0', ['>=', ['get', 'voltage'], 380], '#C00000', ['>=', ['get', 'voltage'], 275], '#ED7D31', '#FFC000'],
  'stroke-width': ['case', ['==', ['get', 'current'], 'DC'], 1.6, ['>=', ['get', 'voltage'], 380], 1.3, 1],
}]];

const OSLO = [[{
  'fill-color': ['interpolate', ['linear'], ['get', 'no2_ugm3'], 0, 'rgba(119, 116, 181, 0.8)', 5, 'rgba(156, 185, 199, 0.8)', 10, 'rgba(201, 230, 194, 0.8)', 15, 'rgba(255, 245, 176, 0.8)', 20, 'rgba(248, 197, 140, 0.8)', 25, 'rgba(223, 128, 111, 0.8)', 30, 'rgba(189, 69, 107, 0.8)'],
  'stroke-color': 'rgba(0,0,0,0.2)',
  'stroke-width': 1,
}]];

const FIELDS = [{ 'stroke-width': 1, 'stroke-color': 'rgba(255,0,0,1)' }];

const roundTrip = (style: unknown[]) => {
  const parsed = fromFlatStyleArray(style);
  const out = toFlatStyleArray(parsed.rules);
  return parsed.fallbacks.length ? style : out;
};

describe('test-config styles survive open → save unchanged', () => {
  it.each([['HV grid', HV_GRID], ['Oslo NO2', OSLO], ['Field boundaries', FIELDS]])('%s', (_n, style) => {
    // Semantic equality: saving without edits must not alter the style.
    const flat = (s: unknown) => JSON.stringify(s).replace(/\[\[/g, '[').replace(/\]\]/g, ']');
    expect(flat(roundTrip(style as unknown[]))).toEqual(flat(style));
  });
});
