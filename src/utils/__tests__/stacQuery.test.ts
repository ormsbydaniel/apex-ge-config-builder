import { describe, expect, it } from 'vitest';
import { inspectStacQueryTarget, parseStacCoreQuery, updateStacCoreQuery, validateBbox } from '@/utils/stacQuery';

const fakeFetch = (body: any) => async () => ({ ok: true, json: async () => body });

describe('STAC core query URLs', () => {
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