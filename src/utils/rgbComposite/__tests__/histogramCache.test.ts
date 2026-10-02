import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getHistogram, peekStretch, __resetHistogramCache, computeStretchMatrix } from '../histogramCache';
import { computeStretch } from '../recipes';

const hist = { bins: [{ x: 10, count: 5 }, { x: 50, count: 10 }, { x: 90, count: 5 }], min: 0, max: 100 } as any;

describe('histogramCache', () => {
  let fetcher: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    fetcher = vi.fn(async () => hist);
    __resetHistogramCache(fetcher as any);
  });

  it('merges duplicate requests and serves later ones from cache', async () => {
    await Promise.all([getHistogram('a', 0), getHistogram('a', 0)]);
    await getHistogram('a', 0);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(peekStretch('a', 0, undefined, 'min-max')).toEqual(computeStretch('min-max', hist));
  });

  it('evicts failures so they can retry', async () => {
    fetcher.mockRejectedValueOnce(new Error('x'));
    await expect(getHistogram('b', 1)).rejects.toThrow();
    await getHistogram('b', 1);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('matrix matches computeStretch for every method', () => {
    const m = computeStretchMatrix(hist);
    (['percent-2-98', 'min-max', 'mean-2sd'] as const).forEach((k) => expect(m[k]).toEqual(computeStretch(k, hist)));
  });
});
