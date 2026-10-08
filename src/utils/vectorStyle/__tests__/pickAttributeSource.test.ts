import { describe, it, expect, vi } from 'vitest';
import { pickAttributeSource } from '../pickAttributeSource';

describe('pickAttributeSource', () => {
  it('skips files without attribute columns', async () => {
    const detect = vi.fn(async (url: string) => (url === 'c.fgb' ? [{ name: 'area', type: 'double' }] : []));
    const r = await pickAttributeSource(
      [{ url: 'a.fgb', format: 'flatgeobuf' }, { url: 'x', format: 'cog' }, { url: 'b.fgb', format: 'flatgeobuf' }, { url: 'c.fgb', format: 'flatgeobuf' }],
      detect,
    );
    expect(r?.url).toBe('c.fgb');
    expect(r?.inspected).toBe(3);
  });

  it('returns null when no file has attributes, and tolerates failures in multi-file layers', async () => {
    const detect = vi.fn(async (url: string) => { if (url === 'a.fgb') throw new Error('x'); return []; });
    expect(await pickAttributeSource([{ url: 'a.fgb', format: 'fgb' }, { url: 'b.fgb', format: 'fgb' }], detect)).toBeNull();
  });

  it('rethrows the error for a single unreachable file', async () => {
    const detect = vi.fn(async () => { throw new Error('Failed to fetch'); });
    await expect(pickAttributeSource([{ url: 'a.fgb', format: 'fgb' }], detect)).rejects.toThrow('Failed to fetch');
  });
});

describe('pickAttributeSource with STAC items', () => {
  it('probes the resolved sample asset URL for a mapped STAC vector asset', async () => {
    vi.resetModules();
    vi.doMock('@/utils/stacAssetFormat', async (importOriginal) => {
      const actual = await importOriginal<typeof import('@/utils/stacAssetFormat')>();
      return {
        ...actual,
        resolveDataSourceInspectionAccess: vi.fn(async () => ({ format: 'flatgeobuf', url: 'https://x.test/sample.fgb' })),
      };
    });
    const { pickAttributeSource: pick } = await import('../pickAttributeSource');
    const detect = vi.fn(async (url: string) => (url === 'https://x.test/sample.fgb' ? [{ name: 'crop', type: 'string' }] : []));
    const r = await pick(
      [{ url: 'https://x.test/collections/c/items', format: 'stac', assets: ['data'], assetFormats: { data: 'flatgeobuf' } }],
      detect,
    );
    expect(r?.url).toBe('https://x.test/sample.fgb');
    expect(r?.format).toBe('flatgeobuf');
    expect(detect).toHaveBeenCalledWith('https://x.test/sample.fgb', 'flatgeobuf');
    vi.doUnmock('@/utils/stacAssetFormat');
    vi.resetModules();
  });

  it('skips STAC items whose mapped asset is not a vector format', async () => {
    const detect = vi.fn(async () => [{ name: 'x', type: 'string' }]);
    const r = await pickAttributeSource(
      [{ url: 'https://x.test/collections/c/items', format: 'stac', assets: ['visual'], assetFormats: { visual: 'cog' } }],
      detect,
    );
    expect(r).toBeNull();
    expect(detect).not.toHaveBeenCalled();
  });
});
