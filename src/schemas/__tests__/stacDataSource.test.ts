import { describe, expect, it } from 'vitest';
import { DataSourceItemSchema } from '@/schemas/configSchema';
import { getStacCollectionDataSourceUrl } from '@/utils/stacUtils';

describe('STAC collection data sources', () => {
  it('preserves asset names, zoom bounds, and styles through validation', () => {
    const style = [{ 'stroke-color': 'rgba(51, 94, 111, 0.85)', 'stroke-width': 1 }];
    const parsed = DataSourceItemSchema.parse({
      url: 'https://eoresults.esa.int/stac/collections/tillage_type_detection',
      format: 'stac',
      zIndex: 50,
      assets: ['classification'],
      minZoom: 10,
      maxZoom: 18,
      style,
    });

    expect(parsed).toMatchObject({ format: 'stac', assets: ['classification'], minZoom: 10, maxZoom: 18, style });
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