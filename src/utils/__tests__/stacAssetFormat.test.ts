import { describe, expect, it } from 'vitest';
import { getEffectiveFormat, sampleStacAsset } from '@/utils/stacAssetFormat';
import { DataSourceItemSchema } from '@/schemas/configSchema';

const fakeFetch = (routes: Record<string, any>) => async (url: string) => {
  const key = Object.keys(routes).find((k) => url.startsWith(k));
  return key ? { ok: true, json: async () => routes[key] } : { ok: false, status: 404, json: async () => ({}) };
};

describe('STAC asset format', () => {
  it('uses assetFormat as the effective format for STAC sources', () => {
    expect(getEffectiveFormat({ format: 'stac', assetFormat: 'cog' })).toBe('cog');
    expect(getEffectiveFormat({ format: 'stac' })).toBe('stac');
    expect(getEffectiveFormat({ format: 'geojson', assetFormat: 'cog' })).toBe('geojson');
  });

  it('detects a COG asset from a collection items link', async () => {
    const res = await sampleStacAsset('https://x.test/collections/c', ['classification'], fakeFetch({
      'https://x.test/collections/c/items': { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, assets: {
        thumbnail: { href: 't.png', type: 'image/png' },
        classification: { href: 'https://x.test/a.tif', type: 'image/tiff; application=geotiff', 'eo:bands': [{ name: 'B04' }] },
      } }] },
      'https://x.test/collections/c': { links: [{ rel: 'items', href: 'https://x.test/collections/c/items' }] },
    }));
    expect(res).toMatchObject({ format: 'cog', sampleUrl: 'https://x.test/a.tif', bandLabels: ['B04'], assetName: 'classification' });
  });

  it('detects FlatGeobuf from an items URL', async () => {
    const res = await sampleStacAsset('https://x.test/items', ['data'], fakeFetch({
      'https://x.test/items': { features: [{ assets: { data: { href: 'https://x.test/f.fgb' } } }] },
    }));
    expect(res.format).toBe('flatgeobuf');
  });

  it('keeps assetFormat through validation', () => {
    expect(DataSourceItemSchema.parse({ url: 'https://x.test', format: 'stac', zIndex: 1, assetFormat: 'cog' }).assetFormat).toBe('cog');
  });
});
