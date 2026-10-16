import { describe, expect, it } from 'vitest';
import { buildStacSearchUrl, stacPeriod } from '../templates';

describe('STAC monitor periods and cloud cover', () => {
  it('winter runs from December of the previous year to end of February', () => {
    expect(stacPeriod({ season: 'winter', year: '2024' })).toEqual(['2023-12-01', '2024-02-29']);
  });
  it('autumn covers September to November', () => {
    expect(stacPeriod({ season: 'autumn', year: '2019' })).toEqual(['2019-09-01', '2019-11-30']);
  });
  it('adds a max cloud cover query, omitted at 100%', () => {
    const u = buildStacSearchUrl('https://x/collections/c', [0, 0], 10, '2024-01-01', '2024-02-01', 20, 'query');
    expect(JSON.parse(new URL(u).searchParams.get('query')!)).toEqual({ 'eo:cloud_cover': { lte: 20 } });
    expect(buildStacSearchUrl('https://x/collections/c', [0, 0], 10, 'a', 'b', 100)).not.toContain('query');
  });
});
