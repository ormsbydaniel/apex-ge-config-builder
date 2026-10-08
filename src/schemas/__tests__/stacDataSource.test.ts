import { describe, expect, it } from 'vitest';
import { DataSourceItemSchema } from '@/schemas/configSchema';
import { extractBandLabels, getStacCollectionDataSourceUrl } from '@/utils/stacUtils';

describe('STAC collection data sources', () => {
  it('preserves asset names, formats, zoom bounds, and styles through validation', () => {
    const style = [{ 'stroke-color': 'rgba(51, 94, 111, 0.85)', 'stroke-width': 1 }];
    const parsed = DataSourceItemSchema.parse({
      url: 'https://eoresults.esa.int/stac/collections/tillage_type_detection',
      format: 'stac',
      zIndex: 50,
      assets: ['classification'],
      assetFormats: { classification: 'cog' },
      minZoom: 10,
      maxZoom: 18,
      style,
    });

    expect(parsed).toMatchObject({ format: 'stac', assets: ['classification'], assetFormats: { classification: 'cog' }, minZoom: 10, maxZoom: 18, style });
  });

  it('accepts existing STAC sources without stored asset formats', () => {
    expect(DataSourceItemSchema.parse({
      url: 'https://example.test/collections/legacy',
      format: 'stac',
      zIndex: 50,
      assets: ['data'],
    }).assetFormats).toBeUndefined();
  });

  it('uses a collection self link when available', () => {
    expect(getStacCollectionDataSourceUrl({
      id: 'ports',
      links: [{ rel: 'self', href: './ports/collection.json' }],
    }, 'https://example.test/catalog.json')).toBe('https://example.test/ports/collection.json');
  });

  it('constructs a STAC API collection endpoint when no self link is available', () => {
    expect(getStacCollectionDataSourceUrl({ id: 'ports' }, 'https://example.test/stac?token=public'))
      .toBe('https://example.test/stac/collections/ports');
  });

  it('uses the known static collection URL as the fallback', () => {
    expect(getStacCollectionDataSourceUrl({
      id: 'ports',
      collectionUrl: 'https://example.test/static/ports/collection.json',
    }, 'https://example.test/catalog.json')).toBe('https://example.test/static/ports/collection.json');
  });
});

describe('extractBandLabels', () => {
  it('reads band names from asset-level eo:bands', () => {
    expect(extractBandLabels({
      href: 'https://example.test/cog.tif',
      'eo:bands': [{ name: 'B02' }, { name: 'B03' }, { name: 'B04' }],
    })).toEqual(['B02', 'B03', 'B04']);
  });

  it('falls back to item-level eo:bands and common_name', () => {
    expect(extractBandLabels(
      { href: 'https://example.test/cog.tif' },
      { 'eo:bands': [{ common_name: 'red' }, { name: 'B08' }] },
    )).toEqual(['red', 'B08']);
  });

  it('returns undefined when no eo:bands metadata is present', () => {
    expect(extractBandLabels({ href: 'https://example.test/cog.tif' })).toBeUndefined();
    expect(extractBandLabels({ href: 'https://example.test/cog.tif' }, {})).toBeUndefined();
  });

  it('preserves bandLabels through data source validation', () => {
    const parsed = DataSourceItemSchema.parse({
      url: 'https://example.test/cog.tif',
      format: 'cog',
      zIndex: 50,
      bandLabels: ['B02', 'B03', 'B04'],
    });
    expect(parsed.bandLabels).toEqual(['B02', 'B03', 'B04']);
  });
});
describe('STAC asset name on load', () => {
  it('still loads existing STAC sources without an asset name', () => {
    expect(DataSourceItemSchema.safeParse({ url: 'https://x.test/items', format: 'stac', zIndex: 1 }).success).toBe(true);
  });
});
