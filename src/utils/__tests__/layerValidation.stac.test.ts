import { describe, it, expect, vi, beforeEach } from 'vitest';

const getStacSample = vi.fn();
const listStacAssets = vi.fn();
vi.mock('@/utils/stacAssetFormat', async (orig) => ({
  ...(await orig<typeof import('@/utils/stacAssetFormat')>()),
  getStacSample: (...a: unknown[]) => getStacSample(...a),
  listStacAssets: (...a: unknown[]) => listStacAssets(...a),
}));
vi.mock('@/utils/cogPerformanceProbe', () => ({ probeCogPerformance: vi.fn(async () => ({ status: 'ok' })) }));
vi.mock('@/utils/geojsonProbe', () => ({ probeGeojsonSize: vi.fn(async () => ({ status: 'ok' })) }));

import { validateLayerUrls } from '@/utils/layerValidation';

const STAC = 'https://stac.example.com/collections/c/items';
const SAMPLE = 'https://files.example.com/a.tif?sig=secret';

const layer = (extra: Record<string, unknown>) =>
  ({ name: 'L', data: [{ url: STAC, format: 'stac', ...extra }] }) as any;

const fetchOk = (failUrls: string[] = []) =>
  vi.fn(async (u: string) => ({ ok: !failUrls.some(f => u.startsWith(f)), status: failUrls.some(f => u.startsWith(f)) ? 404 : 200, headers: new Headers() }));

beforeEach(() => {
  getStacSample.mockReset();
  listStacAssets.mockReset();
  vi.stubGlobal('fetch', fetchOk());
});

describe('STAC layer validation', () => {
  it('validates a mapped COG asset and reports the saved STAC URL', async () => {
    getStacSample.mockResolvedValue({ assetName: 'data', sampleUrl: SAMPLE });
    const r = await validateLayerUrls(layer({ assets: ['data'], assetFormats: { data: 'cog' } }));
    expect(r.urlResults[0].status).toBe('valid');
    expect(r.urlResults[0].url).toBe(STAC);
    expect(JSON.stringify(r)).not.toContain('sig=secret');
  });

  it('validates a mapped FlatGeobuf asset', async () => {
    getStacSample.mockResolvedValue({ assetName: 'v', sampleUrl: 'https://files.example.com/v.fgb' });
    const r = await validateLayerUrls(layer({ assets: ['v'], assetFormats: { v: 'flatgeobuf' } }));
    expect(r.urlResults[0].status).toBe('valid');
  });

  it('errors when the endpoint is unreachable', async () => {
    vi.stubGlobal('fetch', fetchOk([STAC]));
    const r = await validateLayerUrls(layer({ assets: ['data'], assetFormats: { data: 'cog' } }));
    expect(r.urlResults[0].status).toBe('error');
    expect(getStacSample).not.toHaveBeenCalled();
  });

  it('errors when there are no items', async () => {
    getStacSample.mockResolvedValue({});
    listStacAssets.mockResolvedValue([]);
    const r = await validateLayerUrls(layer({ assets: ['data'], assetFormats: { data: 'cog' } }));
    expect(r.urlResults[0].error).toMatch(/no items/);
  });

  it('errors and lists found names when the asset is missing', async () => {
    getStacSample.mockResolvedValue({});
    listStacAssets.mockResolvedValue([{ name: 'visual' }, { name: 'B04' }]);
    const r = await validateLayerUrls(layer({ assets: ['data'], assetFormats: { data: 'cog' } }));
    expect(r.urlResults[0].error).toContain('visual, B04');
  });

  it('errors when the asset file is unreachable', async () => {
    vi.stubGlobal('fetch', fetchOk(['https://files.example.com']));
    getStacSample.mockResolvedValue({ assetName: 'data', sampleUrl: SAMPLE });
    const r = await validateLayerUrls(layer({ assets: ['data'], assetFormats: { data: 'cog' } }));
    expect(r.urlResults[0].status).toBe('error');
    expect(r.urlResults[0].url).toBe(STAC);
    expect(r.urlResults[0].error).toContain('Checked asset data (cog)');
  });

  it('warns when the asset name or format is missing', async () => {
    const r = await validateLayerUrls(layer({}));
    expect(r.urlResults[0].status).toBe('performance-warning');
    expect(r.urlResults[0].warning).toMatch(/select an asset/);
  });
});
