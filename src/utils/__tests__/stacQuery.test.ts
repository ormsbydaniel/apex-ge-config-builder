import { describe, expect, it } from 'vitest';
import { getStacCollectionIds, getStacUrlBase, inspectStacQueryTarget, isStacSearchUrl, itemsUrlToSearchUrl, parseStacCoreQuery, replaceStacUrlBase, searchUrlToItemsUrl, updateStacCoreQuery, validateBbox } from '@/utils/stacQuery';
import { getStacCollectionUrl } from '@/utils/stacMetadata';

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

describe('STAC /search endpoint support', () => {
  const itemsUrl = 'https://api.test/stac/collections/sentinel2_ard/items?bbox=-3,51,-1,52&datetime=2026-06-01T00:00:00Z/2026-07-01T00:00:00Z&limit=100&filter=cloud_cover%20%3C%2010&filter-lang=cql2-text&token=public';

  it('recognises search URLs with a collections parameter', () => {
    expect(isStacSearchUrl('https://api.test/stac/search?collections=sentinel2_ard')).toBe(true);
    expect(isStacSearchUrl('https://api.test/stac/search')).toBe(false);
    expect(isStacSearchUrl(itemsUrl)).toBe(false);
    expect(isStacSearchUrl('not a url')).toBe(false);
  });

  it('converts items to search and back, preserving every filter and unrelated parameter', () => {
    const search = itemsUrlToSearchUrl(itemsUrl)!;
    const parsed = new URL(search);
    expect(parsed.pathname).toBe('/stac/search');
    expect(parsed.searchParams.get('collections')).toBe('sentinel2_ard');
    expect(parsed.searchParams.get('bbox')).toBe('-3,51,-1,52');
    expect(parsed.searchParams.get('datetime')).toBe('2026-06-01T00:00:00Z/2026-07-01T00:00:00Z');
    expect(parsed.searchParams.get('limit')).toBe('100');
    expect(parsed.searchParams.get('filter')).toBe('cloud_cover < 10');
    expect(parsed.searchParams.get('filter-lang')).toBe('cql2-text');
    expect(parsed.searchParams.get('token')).toBe('public');

    const back = new URL(searchUrlToItemsUrl(search)!);
    expect(back.pathname).toBe('/stac/collections/sentinel2_ard/items');
    expect(back.searchParams.get('collections')).toBeNull();
    expect(back.searchParams.get('filter')).toBe('cloud_cover < 10');
    expect(back.searchParams.get('token')).toBe('public');
  });

  it('refuses to convert multi-collection searches or non-items paths', () => {
    expect(searchUrlToItemsUrl('https://api.test/search?collections=a,b')).toBeUndefined();
    expect(itemsUrlToSearchUrl('https://api.test/items?limit=5')).toBeUndefined();
  });

  it('classifies search URLs without a network call', async () => {
    const target = await inspectStacQueryTarget('https://api.test/stac/search?collections=sentinel2_ard&limit=10');
    expect(target).toEqual({ kind: 'search', searchUrl: 'https://api.test/stac/search?collections=sentinel2_ard&limit=10', collectionId: 'sentinel2_ard' });
  });

  it('derives the collection URL from a search URL for queryables and metadata', () => {
    expect(getStacCollectionUrl('https://api.test/stac/search?collections=sentinel2_ard&limit=10'))
      .toBe('https://api.test/stac/collections/sentinel2_ard');
    expect(getStacCollectionUrl('https://api.test/stac/search?collections=a,b')).toBe('https://api.test/stac/collections/a');
    expect(getStacCollectionUrl('https://api.test/stac/search')).toBeNull();
  });
});

describe('STAC collection identifiers', () => {
  it('reads the collection from an items endpoint', () => {
    expect(getStacCollectionIds('https://api.test/stac/collections/sentinel2_ard/items?limit=10')).toEqual(['sentinel2_ard']);
  });

  it('reads the collection from a single item or collection URL', () => {
    expect(getStacCollectionIds('https://api.test/stac/collections/s2/items/abc')).toEqual(['s2']);
    expect(getStacCollectionIds('https://api.test/stac/collections/s2')).toEqual(['s2']);
  });

  it('lists every collection in a search request', () => {
    expect(getStacCollectionIds('https://api.test/stac/search?collections=a,b&limit=10')).toEqual(['a', 'b']);
  });

  it('returns nothing for unrelated or malformed URLs', () => {
    expect(getStacCollectionIds('https://api.test/stac/items?limit=5')).toEqual([]);
    expect(getStacCollectionIds('not a url')).toEqual([]);
  });
});

import {
  detectStacFilterSupport as detectSupport,
  parseStacCql2Filter as parseFilter,
  updateStacCql2Filter as updateFilter,
  getStacApiRoot,
} from '../stacQuery';

describe('STAC Query extension', () => {
  const base = 'https://earth-search.aws.element84.com/v1/search?collections=s2&limit=10';
  it('writes and parses query= round trips', () => {
    const url = updateFilter(base, [
      { property: 'eo:cloud_cover', type: 'number', operator: 'lt', values: ['5'] },
      { property: 'platform', type: 'string', operator: 'in', values: ['sentinel-2a', 'sentinel-2b'] },
    ], 'query');
    const params = new URL(url).searchParams;
    expect(JSON.parse(params.get('query')!)).toEqual({ 'eo:cloud_cover': { lt: 5 }, platform: { in: ['sentinel-2a', 'sentinel-2b'] } });
    expect(params.get('filter')).toBeNull();
    expect(params.get('limit')).toBe('10');
    const parsed = parseFilter(url);
    expect(parsed && 'rules' in parsed && parsed.rules.length).toBe(2);
  });
  it('keeps the existing style and clears both params on removal', () => {
    const url = updateFilter(base, [{ property: 'x', type: 'number', operator: 'between', values: ['1', '3'] }], 'query');
    const again = updateFilter(url, [{ property: 'x', type: 'number', operator: 'gt', values: ['2'] }]);
    expect(new URL(again).searchParams.get('query')).toBe('{"x":{"gt":2}}');
    const cleared = updateFilter(again, undefined);
    expect(new URL(cleared).searchParams.has('query')).toBe(false);
  });
  it('picks the style from conformance', async () => {
    expect(getStacApiRoot('https://a.org/v1/collections/c/items?x=1')).toBe('https://a.org/v1/');
    const f = (conforms: string[]) => async () => ({ ok: true, json: async () => ({ conformsTo: conforms }) });
    expect(await detectSupport('https://q.org/v1/search', f(['https://api.stacspec.org/v1.0.0/item-search#query']))).toEqual({ style: 'query', advertised: true });
    expect(await detectSupport('https://c.org/v1/search', f(['http://www.opengis.net/spec/cql2/1.0/conf/cql2-text']))).toEqual({ style: 'cql2', advertised: true });
    expect(await detectSupport('https://n.org/v1/search', f([]))).toEqual({ style: 'cql2', advertised: false });
  });
});
