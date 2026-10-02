/**
 * Session-wide in-memory cache of COG band histograms and their derived
 * stretch ranges. Each (url, band, noData) is fetched once; duplicate
 * requests share the in-flight promise; failures are evicted so they retry.
 */
import { fetchBandHistogram, BandHistogramResult } from '@/utils/cogMetadata';
import { computeStretch, StretchMethod, STRETCH_METHODS } from './recipes';

export type StretchMatrix = Record<StretchMethod, { min: number; max: number }>;

interface Entry {
  promise: Promise<BandHistogramResult>;
  result?: BandHistogramResult;
  stretches?: StretchMatrix;
}

const MAX_ENTRIES = 200;
const cache = new Map<string, Entry>();
let fetcher: typeof fetchBandHistogram = fetchBandHistogram;

const keyOf = (url: string, band0: number, noData?: number) => `${url}|${band0}|${noData ?? ''}`;

export function computeStretchMatrix(hist: BandHistogramResult): StretchMatrix {
  const out = {} as StretchMatrix;
  STRETCH_METHODS.forEach((m) => { out[m.id] = computeStretch(m.id, hist); });
  return out;
}

export function getHistogram(url: string, band0: number, noData?: number): Promise<BandHistogramResult> {
  const key = keyOf(url, band0, noData);
  const hit = cache.get(key);
  if (hit) {
    cache.delete(key); cache.set(key, hit); // LRU touch
    return hit.promise;
  }
  const entry: Entry = { promise: null as any };
  entry.promise = fetcher(url, band0, noData).then(
    (result) => { entry.result = result; entry.stretches = computeStretchMatrix(result); return result; },
    (err) => { if (cache.get(key) === entry) cache.delete(key); throw err; },
  );
  cache.set(key, entry);
  while (cache.size > MAX_ENTRIES) cache.delete(cache.keys().next().value as string);
  return entry.promise;
}

/** Synchronous lookup of a precomputed stretch; undefined if not cached yet. */
export function peekStretch(url: string, band0: number, noData: number | undefined, method: StretchMethod) {
  return cache.get(keyOf(url, band0, noData))?.stretches?.[method];
}

/** Test helpers. */
export function __resetHistogramCache(f: typeof fetchBandHistogram = fetchBandHistogram) {
  cache.clear();
  fetcher = f;
}
