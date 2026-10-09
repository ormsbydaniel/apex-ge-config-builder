import { describe, it, expect } from 'vitest';
import { compareStacFilterEndpoints, evaluateRule } from '../stacFilterComparison';
import type { StacPropertyRule } from '../stacQuery';

const rule: StacPropertyRule = { property: 'cloud_cover', type: 'number', operator: 'lt', values: ['10'] };
const all = [{ id: 'a', properties: { 'eo:cloud_cover': 5 } }, { id: 'b', properties: { 'eo:cloud_cover': 60 } }];
const low = [all[0]];

const fakeFetch = (handler: (url: string) => any) => async (url: string) => {
  const body = handler(url);
  return { ok: !body.error, status: body.error ? 400 : 200, json: async () => body };
};

describe('stacFilterComparison', () => {
  it('evaluates rules against eo-prefixed properties', () => {
    expect(evaluateRule(rule, { 'eo:cloud_cover': 5 })).toBe(true);
    expect(evaluateRule(rule, { 'eo:cloud_cover': 50 })).toBe(false);
    expect(evaluateRule(rule, {})).toBeUndefined();
  });

  it('detects items ignoring the filter while search applies it', async () => {
    const result = await compareStacFilterEndpoints(
      'https://x.org/stac/collections/s2/items?limit=10',
      [rule],
      fakeFetch((url) => ({ features: url.includes('/search') && url.includes('filter') ? low : all })),
    );
    const byKey = Object.fromEntries(result.probes.map((p) => [p.key, p]));
    expect(byKey['items-filtered'].verdict).toBe('ignored');
    expect(byKey['search-filtered'].verdict).toBe('applied');
    expect(result.recommendSearch).toBe(true);
  });

  it('tests only search for multi-collection queries', async () => {
    const result = await compareStacFilterEndpoints(
      'https://x.org/stac/search?collections=a,b',
      [rule],
      fakeFetch(() => ({ features: low })),
    );
    expect(result.probes.map((p) => p.key)).toEqual(['search-filtered']);
    expect(result.note).toMatch(/several collections/);
  });

  it('marks errors as not supported', async () => {
    const result = await compareStacFilterEndpoints(
      'https://x.org/stac/collections/s2/items',
      'bad filter',
      fakeFetch((url) => (url.includes('filter') ? { error: true, description: 'Invalid filter' } : { features: all })),
    );
    expect(result.probes.find((p) => p.key === 'items-filtered')?.verdict).toBe('unsupported');
  });
});
