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

import { summariseStacQueryables } from '@/utils/stacMetadata';
import { operatorsForQueryable } from '@/utils/stacQuery';

describe('summariseStacQueryables $ref inference', () => {
  it('treats referenced eo:cloud_cover and datetimes as comparable', () => {
    const list = summariseStacQueryables({ properties: {
      cloud_cover: { $ref: 'https://stac-extensions.github.io/eo/v1.0.0/schema.json#/definitions/fields/properties/eo:cloud_cover' },
      created: { $ref: 'https://schemas.stacspec.org/v1.0.0/item-spec/json-schema/datetime.json#/properties/created' },
      id: { $ref: 'https://schemas.stacspec.org/v1.0.0/item-spec/json-schema/item.json#/definitions/core/allOf/2/properties/id' },
    } });
    const cc = list.find((q) => q.key === 'cloud_cover')!;
    expect(cc.type).toBe('number');
    expect(cc.range).toBe('0 – 100');
    expect(operatorsForQueryable(cc)).toContain('lte');
    expect(list.find((q) => q.key === 'created')!.type).toBe('string (date-time)');
    expect(operatorsForQueryable(list.find((q) => q.key === 'id')!)).toEqual(['eq', 'neq', 'like']);
  });
});
