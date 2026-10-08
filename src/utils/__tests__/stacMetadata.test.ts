import { describe, expect, it } from 'vitest';
import { fetchStacItemSample, getStacCollectionUrl, isStacSingleItemUrl, stripUrlParams } from '@/utils/stacMetadata';

const f = (body: any) => async () => ({ ok: true, json: async () => body });

describe('stacMetadata', () => {
  it('derives the collection URL', () => {
    expect(getStacCollectionUrl('https://x.test/stac/collections/c1/items?limit=5')).toBe('https://x.test/stac/collections/c1');
    expect(getStacCollectionUrl('https://x.test/collections/c1/items/abc')).toBe('https://x.test/collections/c1');
    expect(getStacCollectionUrl('https://x.test/search')).toBeNull();
  });
  it('detects single items and strips params', () => {
    expect(isStacSingleItemUrl('https://x.test/collections/c/items/abc')).toBe(true);
    expect(isStacSingleItemUrl('https://x.test/collections/c/items?limit=1')).toBe(false);
    expect(stripUrlParams('https://x.test/a.tif?sig=secret')).toBe('https://x.test/a.tif');
  });
  it('samples items vs single item', async () => {
    const list = await fetchStacItemSample('https://x.test/collections/c/items', f({ features: [{ id: 'a' }, { id: 'b' }], numberMatched: 9 }));
    expect(list).toMatchObject({ single: false, returned: 2, matched: 9, item: { id: 'a' } });
    const one = await fetchStacItemSample('https://x.test/collections/c/items/a', f({ type: 'Feature', id: 'a' }));
    expect(one).toMatchObject({ single: true, item: { id: 'a' } });
  });
});
