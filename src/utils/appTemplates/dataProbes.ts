/**
 * Advisory data probes for the /apps wizard. They ask the chosen data endpoint
 * what it actually offers (WMS layers, STAC extents and counts, vector extents)
 * so later wizard steps can adapt. Every probe is best-effort: failures resolve
 * to `{ failed: true }` and the wizard falls back to its static choices.
 */
import { fetchServiceCapabilities } from '@/utils/serviceCapabilities';
import { fetchStacCollection } from '@/utils/stacMetadata';
import { fetchFlatGeobufMetadata } from '@/utils/flatgeobufMetadata';

export type Bbox = [number, number, number, number];

export interface DataInsight {
  /** Years available (e.g. EOX Sentinel-2 cloudless mosaics). */
  years?: string[];
  /** Layer names offered by a WMS service. */
  layers?: { name: string; title?: string }[];
  /** ISO dates (YYYY-MM-DD); null end = open / ongoing. */
  temporalExtent?: [string | null, string | null];
  /** [minLng, minLat, maxLng, maxLat] in WGS84. */
  bbox?: Bbox;
  note?: string;
  failed?: boolean;
}

const TIMEOUT_MS = 10_000;
const cache = new Map<string, Promise<DataInsight>>();

const withTimeout = <T,>(p: Promise<T>): Promise<T> =>
  Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), TIMEOUT_MS))]);

const cached = (key: string, run: () => Promise<DataInsight>): Promise<DataInsight> => {
  const hit = cache.get(key);
  if (hit) return hit;
  const p = withTimeout(run()).catch(() => ({ failed: true } as DataInsight));
  p.then((r) => r.failed && cache.delete(key));
  cache.set(key, p);
  return p;
};

/** Years with an EOX `s2cloudless(-YYYY)_3857` layer; the unsuffixed layer is 2016. */
export const parseS2CloudlessYears = (names: string[]): string[] => {
  const years = new Set<string>();
  for (const n of names) {
    const m = /^s2cloudless(?:-(\d{4}))?_3857$/.exec(n);
    if (m) years.add(m[1] ?? '2016');
  }
  return [...years].sort();
};

export const probeWmsLayers = (url: string): Promise<DataInsight> =>
  cached(`wms:${url}`, async () => {
    const caps = await fetchServiceCapabilities(url, 'wms');
    if (!caps?.layers?.length) return { failed: true };
    const layers = caps.layers
      .filter((l) => !!l.name)
      .map((l) => ({ name: l.name as string, title: (l as { title?: string }).title }));
    return { layers, years: parseS2CloudlessYears(layers.map((l) => l.name)) };
  });

const isoDate = (v: unknown): string | null => (typeof v === 'string' && v ? v.slice(0, 10) : null);

export const probeStacCollection = (collectionUrl: string): Promise<DataInsight> =>
  cached(`stac:${collectionUrl}`, async () => {
    const col = await fetchStacCollection(collectionUrl);
    if (!col) return { failed: true };
    const interval = col.extent?.temporal?.interval?.[0] ?? [];
    const bbox = col.extent?.spatial?.bbox?.[0];
    return {
      temporalExtent: [isoDate(interval[0]), isoDate(interval[1])],
      bbox: Array.isArray(bbox) && bbox.length >= 4 ? [bbox[0], bbox[1], bbox[2], bbox[3]] : undefined,
    };
  });

/** Number of items matching a STAC items URL (limit forced to 1). */
export const probeStacCount = async (itemsUrl: string): Promise<number | null> => {
  try {
    const u = new URL(itemsUrl);
    u.searchParams.set('limit', '1');
    const res = await withTimeout(fetch(u.toString()));
    if (!res.ok) return null;
    const j = await res.json();
    const n = j.numberMatched ?? j.context?.matched;
    return typeof n === 'number' ? n : null;
  } catch {
    return null;
  }
};

const extendBbox = (b: Bbox, c: unknown): void => {
  if (Array.isArray(c) && typeof c[0] === 'number') {
    b[0] = Math.min(b[0], c[0]); b[1] = Math.min(b[1], c[1] as number);
    b[2] = Math.max(b[2], c[0]); b[3] = Math.max(b[3], c[1] as number);
  } else if (Array.isArray(c)) c.forEach((x) => extendBbox(b, x));
};

export const geojsonBbox = (gj: { bbox?: number[]; features?: { geometry?: { coordinates?: unknown } }[] }): Bbox | undefined => {
  if (gj.bbox?.length === 4) return gj.bbox as Bbox;
  const b: Bbox = [Infinity, Infinity, -Infinity, -Infinity];
  gj.features?.forEach((f) => extendBbox(b, f.geometry?.coordinates));
  return Number.isFinite(b[0]) ? b : undefined;
};

export const probeVectorExtent = (url: string): Promise<DataInsight> =>
  cached(`vec:${url}`, async () => {
    if (/\.fgb(\?|$)/i.test(url)) {
      const m = await fetchFlatGeobufMetadata(url);
      const { minX, minY, maxX, maxY } = m.bounds;
      return maxX > minX ? { bbox: [minX, minY, maxX, maxY] } : { failed: true };
    }
    const res = await fetch(url);
    if (!res.ok) return { failed: true };
    const bbox = geojsonBbox(await res.json());
    return bbox ? { bbox } : { failed: true };
  });

/** True when a [start, end] period overlaps the data's temporal extent. */
export const periodWithinExtent = (start: string, end: string, extent?: [string | null, string | null]): boolean => {
  if (!extent) return true;
  const [s, e] = extent;
  if (s && end < s) return false;
  if (e && start > e) return false;
  return true;
};

export const pointInBbox = (c: [number, number], b?: Bbox) =>
  !b || (c[0] >= b[0] && c[0] <= b[2] && c[1] >= b[1] && c[1] <= b[3]);
