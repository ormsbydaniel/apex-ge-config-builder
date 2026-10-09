import { describe, expect, it } from 'vitest';
import { getStacUrlBase, inspectStacQueryTarget, parseStacCoreQuery, replaceStacUrlBase, updateStacCoreQuery, validateBbox } from '@/utils/stacQuery';

const fakeFetch = (body: any) => async () => ({ ok: true, json: async () => body });

describe('STAC core query URLs', () => {
  it('shows only the base while retaining the complete formulated URL', () => {
    const source = 'https://x.test/items?token=public&limit=5#results';
    expect(getStacUrlBase(source)).toBe('https://x.test/items');
    expect(replaceStacUrlBase(source, 'https://next.test/search')).toBe('https://next.test/search?token=public&limit=5#results');
  });

  it('imports query parameters and fragments from a complete pasted URL', () => {
    const source = 'https://x.test/items?token=old&limit=5#old';
    expect(replaceStacUrlBase(source, 'https://next.test/items?token=new&bbox=-3,51,-1,52#new'))
      .toBe('https://next.test/items?token=new&bbox=-3,51,-1,52#new');
  });

  it('handles incomplete URL text without losing the user input', () => {
    expect(getStacUrlBase('example.test/items?limit=5')).toBe('example.test/items');
    expect(replaceStacUrlBase('https://x.test/items?limit=5', 'example.test/items')).toBe('example.test/items');
  });

  it('does not rewrite partially typed URLs while typing', () => {
    let current = '';
    for (const char of 'https://example.com/collections/sentinel-2') {
      current = replaceStacUrlBase(current, current + char);
      // The display base must always match exactly what the user has typed.
      expect(getStacUrlBase(current)).toBe(current);
    }
    expect(current).toBe('https://example.com/collections/sentinel-2');
  });

  it('keeps a partially typed host verbatim without adding a trailing slash', () => {
    expect(replaceStacUrlBase('', 'https://e')).toBe('https://e');
    expect(replaceStacUrlBase('https://e?token=public', 'https://ex')).toBe('https://ex?token=public');
    expect(getStacUrlBase('https://e?token=public')).toBe('https://e');
  });

  it('parses the bbox, datetime interval, and limit used by stac-datasets', () => {
    const parsed = parseStacCoreQuery('https://x.test/items?bbox=-3,51,-1,52&datetime=2026-06-01T00:00:00Z/2026-07-01T00:00:00Z&limit=100');
    expect(parsed).toEqual({ bbox: [-3, 51, -1, 52], datetimeStart: '2026-06-01T00:00:00Z', datetimeEnd: '2026-07-01T00:00:00Z', limit: 100 });
  });

  it('updates core fields without dropping unrelated query parameters', () => {
    const result = updateStacCoreQuery('https://x.test/items?token=public&limit=5', { bbox: [-3, 51, -1, 52], datetimeStart: '2026-06-01T00:00:00.000Z', limit: 100 });
    const parsed = new URL(result);
    expect(parsed.searchParams.get('token')).toBe('public');
    expect(parsed.searchParams.get('bbox')).toBe('-3,51,-1,52');
    expect(parsed.searchParams.get('datetime')).toBe('2026-06-01T00:00:00.000Z/..');
    expect(parsed.searchParams.get('limit')).toBe('100');
  });

  it('updates and removes each guided filter independently', () => {
    const source = 'https://x.test/items?token=public&bbox=-3,51,-1,52&datetime=2026-06-01T00:00:00Z/..&limit=100';
    const parsed = parseStacCoreQuery(source);

    const withoutLimit = new URL(updateStacCoreQuery(source, { ...parsed, limit: undefined }));
    expect(withoutLimit.searchParams.get('limit')).toBeNull();
    expect(withoutLimit.searchParams.get('bbox')).toBe('-3,51,-1,52');
    expect(withoutLimit.searchParams.get('datetime')).toBe('2026-06-01T00:00:00Z/..');

    const withoutDate = new URL(updateStacCoreQuery(source, { ...parsed, datetimeStart: undefined, datetimeEnd: undefined }));
    expect(withoutDate.searchParams.get('datetime')).toBeNull();
    expect(withoutDate.searchParams.get('bbox')).toBe('-3,51,-1,52');
    expect(withoutDate.searchParams.get('limit')).toBe('100');

    const withoutBbox = new URL(updateStacCoreQuery(source, { ...parsed, bbox: undefined }));
    expect(withoutBbox.searchParams.get('bbox')).toBeNull();
    expect(withoutBbox.searchParams.get('datetime')).toBe('2026-06-01T00:00:00Z/..');
    expect(withoutBbox.searchParams.get('limit')).toBe('100');
    expect(withoutBbox.searchParams.get('token')).toBe('public');
  });

  it('validates complete and ordered bounding boxes', () => {
    expect(validateBbox(['', '', '', ''])).toBeUndefined();
    expect(validateBbox(['-3', '51', '-1', '52'])).toBeUndefined();
    expect(validateBbox(['3', '51', '-1', '52'])).toBe('West must not exceed east.');
    expect(validateBbox(['-3', '', '-1', '52'])).toBe('Enter all four coordinates as numbers.');
  });

  it('resolves a collection through its advertised items link', async () => {
    await expect(inspectStacQueryTarget('https://x.test/collection', fakeFetch({ links: [{ rel: 'items', href: './items?token=a' }] })))
      .resolves.toEqual({ kind: 'items', itemsUrl: 'https://x.test/collection/items?token=a' });
  });

  it('distinguishes direct items and static documents', async () => {
    await expect(inspectStacQueryTarget('https://x.test/collections/c/items/one', fakeFetch({}))).resolves.toEqual({ kind: 'item' });
    await expect(inspectStacQueryTarget('https://x.test/static/collection.json', fakeFetch({ links: [] }))).resolves.toEqual({ kind: 'static' });
  });
});
import { operatorsForQueryable, parseStacCql2Filter, serialiseCql2Rules, updateStacCql2Filter, type StacPropertyRule } from '@/utils/stacQuery';

describe('STAC CQL2 property filters', () => {
  const base = 'https://x.test/collections/s2/items?token=public&limit=50&bbox=-3,51,-1,52';
  const rules: StacPropertyRule[] = [
    { property: 'eo:cloud_cover', type: 'number', operator: 'lte', values: ['20'] },
    { property: 'platform', type: 'string', operator: 'eq', values: ["sentinel-2a's"] },
    { property: 'sat:relative_orbit', type: 'number', operator: 'between', values: ['10', '30'] },
    { property: 'constellation', type: 'string', operator: 'in', values: ['a', 'b'] },
    { property: 'title', type: 'string', operator: 'like', values: ['T30'] },
    { property: 'created', type: 'datetime', operator: 'gt', values: ['2026-01-01T00:00:00.000Z'] },
    { property: 'flag', type: 'boolean', operator: 'eq', values: ['true'] },
  ];

  it('serialises and round-trips every operator, preserving other parameters', () => {
    const url = updateStacCql2Filter(base, rules);
    const parsed = new URL(url);
    expect(parsed.searchParams.get('filter-lang')).toBe('cql2-text');
    expect(parsed.searchParams.get('filter')).toBe(serialiseCql2Rules(rules));
    expect(parsed.searchParams.get('filter')).toContain("'sentinel-2a''s'");
    expect(parsed.searchParams.get('token')).toBe('public');
    expect(parsed.searchParams.get('limit')).toBe('50');
    expect(parsed.searchParams.get('bbox')).toBe('-3,51,-1,52');
    expect(parseStacCql2Filter(url)).toEqual({ rules });
  });

  it('falls back to raw text for unsupported expressions', () => {
    const url = updateStacCql2Filter(base, "a = 1 OR b = 2");
    expect(parseStacCql2Filter(url)).toEqual({ raw: 'a = 1 OR b = 2' });
  });

  it('removes both filter parameters when cleared', () => {
    const cleared = new URL(updateStacCql2Filter(updateStacCql2Filter(base, rules), []));
    expect(cleared.searchParams.get('filter')).toBeNull();
    expect(cleared.searchParams.get('filter-lang')).toBeNull();
    expect(cleared.searchParams.get('limit')).toBe('50');
  });

  it('maps queryable types to operators', () => {
    expect(operatorsForQueryable({ type: 'number' })).toContain('between');
    expect(operatorsForQueryable({ type: 'string' })).toEqual(['eq', 'neq', 'like']);
    expect(operatorsForQueryable({ type: 'string', enumValues: ['a'] })).toEqual(['eq', 'in']);
    expect(operatorsForQueryable({ type: 'boolean' })).toEqual(['eq']);
    expect(operatorsForQueryable({ type: 'string (date-time)' })).toContain('gte');
  });
});
