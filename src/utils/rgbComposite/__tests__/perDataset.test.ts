import { describe, it, expect } from 'vitest';
import {
  applyToScope, resetToFirst, copyToAll, countOwn, computeBatchStretch, datasetLabel, cogIndices,
} from '../perDataset';
import { DataSourceItemSchema } from '@/schemas/configSchema';

const cog = (n: number, extra: any = {}) => ({ url: `https://x/${n}.tif`, format: 'cog', convertToRGB: true, bands: [3, 2, 1], ...extra });
const setBands = (b: number[]) => (d: any) => ({ ...d, bands: b });

describe('per-dataset multi-band settings', () => {
  it('saving the first dataset updates every "same as first" COG but not own ones', () => {
    const data: any[] = [cog(1), cog(2, { styleSource: 'own', bands: [9, 7, 1] }), cog(3), { url: 'u', format: 'xyz' }];
    const out = applyToScope(data, 0, setBands([4, 3, 2]));
    expect(out[0].bands).toEqual([4, 3, 2]);
    expect(out[1].bands).toEqual([9, 7, 1]);
    expect(out[2].bands).toEqual([4, 3, 2]);
    expect(out[3]).toBe(data[3]);
  });

  it('saving the first dataset turns batch items back into "same as first"', () => {
    const data: any[] = [cog(1, { styleSource: 'batch' }), cog(2, { styleSource: 'batch', batchStretch: { method: 'mean-2sd' } })];
    const out = applyToScope(data, 0, setBands([4, 3, 2]));
    expect(out[1].styleSource).toBeUndefined();
    expect(out[1].batchStretch).toBeUndefined();
  });

  it('saving another dataset marks only that one as own', () => {
    const data: any[] = [cog(1), cog(2), cog(3)];
    const out = applyToScope(data, 1, setBands([9, 7, 1]));
    expect(out[1]).toMatchObject({ bands: [9, 7, 1], styleSource: 'own' });
    expect(out[0].bands).toEqual([3, 2, 1]);
    expect(out[2].styleSource).toBeUndefined();
    expect(countOwn(out)).toBe(1);
  });

  it('reset copies the first dataset and removes the marker; copy to all clears markers', () => {
    const data: any[] = [cog(1, { style: { a: 1 } }), cog(2, { styleSource: 'own', bands: [9, 7, 1], spectralIndex: { recipe: 'ndvi' } })];
    const reset = resetToFirst(data, 1);
    expect(reset[1]).toMatchObject({ bands: [3, 2, 1], style: { a: 1 }, url: 'https://x/2.tif' });
    expect(reset[1].styleSource).toBeUndefined();
    expect(reset[1].spectralIndex).toBeUndefined();
    const all = copyToAll(data, 1);
    expect(all[0].bands).toEqual([9, 7, 1]);
    expect(countOwn(all)).toBe(0);
  });

  it('labels datasets by timestamp date', () => {
    expect(datasetLabel(cog(1, { timestamps: [1782255600] }) as any, 1)).toBe('1. 2026-06-23');
    expect(datasetLabel(cog(7) as any, 2)).toBe('2. 7.tif');
  });

  it('computes a stretch per dataset and reports failures', async () => {
    const hist = (lo: number, hi: number) => ({
      bins: [{ x: lo, count: 1 }, { x: hi, count: 1 }], min: lo, max: hi,
    });
    const fetcher = async (url: string) => {
      if (url.endsWith('bad.tif')) throw new Error('nope');
      return url.endsWith('1.tif') ? hist(0, 100) : hist(50, 500);
    };
    const res = await computeBatchStretch(
      [{ index: 0, url: 'https://x/1.tif' }, { index: 2, url: 'https://x/2.tif' }, { index: 3, url: 'https://x/bad.tif' }],
      [3, 2, 1], 'min-max', fetcher as any,
    );
    expect(res.find((r) => r.index === 0)!.ranges![0]).toEqual({ min: 0, max: 100 });
    expect(res.find((r) => r.index === 2)!.ranges![0]).toEqual({ min: 50, max: 500 });
    expect(res.find((r) => r.index === 3)!.error).toBe('nope');
  });

  it('schema keeps the per-dataset marker', () => {
    const parsed = DataSourceItemSchema.safeParse(cog(2, { zIndex: 50, timestamps: [1782255600], styleSource: 'batch', batchStretch: { method: 'mean-2sd' } }));
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect((parsed.data as any).styleSource).toBe('batch');
      expect((parsed.data as any).batchStretch).toEqual({ method: 'mean-2sd' });
    }
    expect(DataSourceItemSchema.safeParse(cog(3, { styleSource: 'nope' })).success).toBe(false);
  });

  it('treats mapped STAC COG assets as COGs without including other STAC assets', () => {
    const stacCog = { format: 'stac', url: 'https://x/items', assets: ['visual'], assetFormats: { visual: 'cog' }, bands: [3, 2, 1] } as any;
    const stacVector = { format: 'stac', url: 'https://x/vector-items', assets: ['data'], assetFormats: { data: 'flatgeobuf' } } as any;
    const data = [stacVector, cog(1), stacCog];
    expect(cogIndices(data)).toEqual([1, 2]);
    const out = applyToScope(data, 2, setBands([9, 7, 1]));
    expect(out[2]).toMatchObject({ format: 'stac', url: 'https://x/items', assets: ['visual'], bands: [9, 7, 1], styleSource: 'own' });
    expect(out[0]).toBe(stacVector);
  });
});
