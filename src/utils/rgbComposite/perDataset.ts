/**
 * Per-dataset multi-band visualisation helpers.
 *
 * Every COG item in a layer either uses the "same as first" settings (the
 * default, `styleSource` absent or 'first'), its "own" settings, or settings
 * produced by a "batch" per-dataset stretch. The first COG item is the one
 * whose settings the "same as first" items follow.
 */
import type { DataSourceItem } from '@/types/dataSource';
import { computeStretch, type StretchMethod } from './recipes';

export type StyleSource = 'first' | 'own' | 'batch';

/** Fields that make up a multi-band visualisation on a data item. */
const VIS_FIELDS = ['convertToRGB', 'bands', 'style', 'spectralIndex', 'computedComposite', 'normalize', 'styleSource', 'batchStretch'] as const;

export const isCog = (d: DataSourceItem) => d.format === 'cog';
export const hasOwnSettings = (d: DataSourceItem) => d.styleSource === 'own';

/** Index of the first COG item, or -1. */
export const firstCogIndex = (data: DataSourceItem[]) => data.findIndex(isCog);

/** Indices of every COG item. */
export const cogIndices = (data: DataSourceItem[]) =>
  data.reduce<number[]>((acc, d, i) => (isCog(d) ? [...acc, i] : acc), []);

/** Strip all multi-band visualisation fields from an item. */
export function stripVisualisation(d: DataSourceItem): DataSourceItem {
  const out: any = { ...d };
  VIS_FIELDS.forEach((k) => delete out[k]);
  return out;
}

/** Copy the visualisation fields of `from` onto `to` (deep enough to avoid shared refs). */
export function copyVisualisation(from: DataSourceItem, to: DataSourceItem, styleSource?: StyleSource): DataSourceItem {
  const out: any = stripVisualisation(to);
  VIS_FIELDS.forEach((k) => {
    if (k === 'styleSource' || k === 'batchStretch') return;
    const v = (from as any)[k];
    if (v !== undefined) out[k] = JSON.parse(JSON.stringify(v));
  });
  if (styleSource && styleSource !== 'first') out.styleSource = styleSource;
  return out;
}

/**
 * Apply an item transform to a scope.
 * - scope = first COG index: transforms the first COG and every COG that does
 *   not have its own settings (batch items revert to "same as first").
 * - any other COG index: transforms only that item and marks it "own".
 */
export function applyToScope(
  data: DataSourceItem[],
  scope: number,
  transform: (d: DataSourceItem) => DataSourceItem,
): DataSourceItem[] {
  const first = firstCogIndex(data);
  if (scope === first) {
    return data.map((d, i) => {
      if (!isCog(d) || (i !== first && hasOwnSettings(d))) return d;
      const out: any = transform(d);
      delete out.styleSource;
      delete out.batchStretch;
      return out;
    });
  }
  return data.map((d, i) => {
    if (i !== scope) return d;
    const out: any = transform(d);
    delete out.batchStretch;
    out.styleSource = 'own';
    return out;
  });
}

/** Reset one item so it follows the first COG again. */
export function resetToFirst(data: DataSourceItem[], index: number): DataSourceItem[] {
  const first = firstCogIndex(data);
  if (first < 0 || index === first) return data;
  return data.map((d, i) => (i === index ? copyVisualisation(data[first], d) : d));
}

/** Copy one item's settings to every COG, clearing all "own"/"batch" markers. */
export function copyToAll(data: DataSourceItem[], index: number): DataSourceItem[] {
  const src = data[index];
  return data.map((d) => (isCog(d) ? copyVisualisation(src, d) : d));
}

/** Count COG items with their own (or batch) settings. */
export function countOwn(data: DataSourceItem[]) {
  return data.filter((d) => isCog(d) && (d.styleSource === 'own' || d.styleSource === 'batch')).length;
}

/** Short human label for a data item: its first timestamp date, else its file name. */
export function datasetLabel(d: DataSourceItem, position: number): string {
  const ts = d.timestamps?.[0];
  const name = (d.url || '').split('?')[0].split('/').pop() || `Dataset ${position}`;
  if (typeof ts === 'number') {
    const ms = ts < 1e11 ? ts * 1000 : ts;
    const date = new Date(ms);
    if (!isNaN(date.getTime())) return `${position}. ${date.toISOString().slice(0, 10)}`;
  }
  return `${position}. ${name}`;
}

// ── Batch per-dataset stretch ──

type HistFetcher = (url: string, bandIndex0: number) => Promise<{ bins: any[]; min: number; max: number }>;

export interface BatchResult {
  index: number;
  ranges?: { min: number; max: number }[];
  error?: string;
}

/**
 * Compute a stretch per COG item for the given bands. Items are processed with
 * limited concurrency; failures are reported per item instead of aborting.
 */
export async function computeBatchStretch(
  items: { index: number; url: string }[],
  bands: number[],
  method: StretchMethod,
  fetchHist: HistFetcher,
  opts: { concurrency?: number; signal?: AbortSignal; onProgress?: (done: number, total: number) => void } = {},
): Promise<BatchResult[]> {
  const { concurrency = 3, signal, onProgress } = opts;
  const results: BatchResult[] = new Array(items.length);
  let next = 0;
  let done = 0;
  const worker = async () => {
    while (next < items.length) {
      if (signal?.aborted) return;
      const k = next++;
      const it = items[k];
      try {
        const ranges: { min: number; max: number }[] = [];
        for (const b of bands) {
          const hist = await fetchHist(it.url, b - 1);
          ranges.push(computeStretch(method, hist));
        }
        results[k] = { index: it.index, ranges };
      } catch (e) {
        results[k] = { index: it.index, error: e instanceof Error ? e.message : 'Failed' };
      }
      done++;
      onProgress?.(done, items.length);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results.filter(Boolean);
}
