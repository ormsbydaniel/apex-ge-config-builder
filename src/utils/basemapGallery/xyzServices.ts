import { DataSource } from '@/types/config';
import { fetchExampleManifest } from '@/utils/exampleManifest';

/** Open basemap registry maintained by the GeoPandas team (derived from leaflet-providers). */
export const XYZ_PROVIDERS_URL =
  'https://raw.githubusercontent.com/geopandas/xyzservices/main/xyzservices/data/providers.json';

export type BasemapCategory = 'Satellite' | 'Light' | 'Dark' | 'Terrain' | 'Streets' | 'Specialist';
export const BASEMAP_CATEGORIES: BasemapCategory[] = ['Satellite', 'Light', 'Dark', 'Terrain', 'Streets', 'Specialist'];

export interface RawProvider {
  url?: string;
  name?: string;
  attribution?: string;
  html_attribution?: string;
  min_zoom?: number;
  max_zoom?: number;
  subdomains?: string | string[];
  status?: string;
  [key: string]: unknown;
}

export interface GalleryEntry {
  id: string;
  name: string;
  provider: string;
  raw: RawProvider;
  category: BasemapCategory;
  requiresKey: boolean;
  /** Placeholder holding the key, e.g. "apikey" or "accessToken". */
  keyField?: string;
  minZoom?: number;
  maxZoom?: number;
  attributionText: string;
  attributionUrl?: string;
}

const KEY_MARKER = '<insert your';
/** Providers whose key is optional: the key query parameter is dropped when no key is given. */
const OPTIONAL_KEY_PROVIDERS = new Set(['CartoDB']);

const isProvider = (v: unknown): v is RawProvider =>
  !!v && typeof v === 'object' && typeof (v as RawProvider).url === 'string';

const CATEGORY_RULES: Array<[RegExp, BasemapCategory]> = [
  [/imagery|satellite|aerial|truecolor|modis|viirs|orthophoto|luchtfoto/i, 'Satellite'],
  [/dark|matter|night|black/i, 'Dark'],
  [/positron|light|gray|grey|toner(?!.*background)|lite|bright|white/i, 'Light'],
  [/topo|terrain|relief|physical|hillshad|elevation|outdoor|landscape/i, 'Terrain'],
  [/street|mapnik|voyager|osm|humanitarian|hot|navigation|road/i, 'Streets'],
];

export const categorise = (name: string): BasemapCategory => {
  for (const [re, cat] of CATEGORY_RULES) if (re.test(name)) return cat;
  return 'Specialist';
};

export const parseHtmlAttributionUrl = (html?: string): string | undefined => {
  if (!html) return undefined;
  const m = html.match(/href=["']([^"']+)["']/i);
  return m?.[1];
};

const cleanAttribution = (text?: string) => (text || '').replace(/\(C\)/g, '©').trim();

const toEntry = (provider: string, raw: RawProvider): GalleryEntry | null => {
  if (!raw.url || !/\{z\}/.test(raw.url) || !/\{x\}/.test(raw.url) || !/\{y\}/.test(raw.url)) return null;
  if (raw.status && /broken/i.test(String(raw.status))) return null;
  const keyField = Object.keys(raw).find(
    (k) => typeof raw[k] === 'string' && (raw[k] as string).toLowerCase().includes(KEY_MARKER),
  );
  const requiresKey = !!keyField && !OPTIONAL_KEY_PROVIDERS.has(provider);
  const name = (raw.name || provider).replace(/\./g, ' ');
  return {
    id: raw.name || provider,
    name,
    provider,
    raw,
    category: categorise(name),
    requiresKey,
    keyField,
    minZoom: typeof raw.min_zoom === 'number' ? raw.min_zoom : undefined,
    maxZoom: typeof raw.max_zoom === 'number' ? raw.max_zoom : undefined,
    attributionText: cleanAttribution(raw.attribution),
    attributionUrl: parseHtmlAttributionUrl(raw.html_attribution),
  };
};

/** Flatten `{ Provider: {url...} | { Variant: {url...} } }` into gallery entries. */
export const flattenProviders = (json: Record<string, unknown>): GalleryEntry[] => {
  const out: GalleryEntry[] = [];
  for (const [provider, value] of Object.entries(json)) {
    if (isProvider(value)) {
      const e = toEntry(provider, value);
      if (e) out.push(e);
    } else if (value && typeof value === 'object') {
      for (const variant of Object.values(value as Record<string, unknown>)) {
        if (isProvider(variant)) {
          const e = toEntry(provider, variant);
          if (e) out.push(e);
        }
      }
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
};

/** Resolve all placeholders except {z}/{x}/{y}. */
export const resolveTemplate = (entry: GalleryEntry, key?: string): string => {
  const raw = entry.raw;
  let url = raw.url as string;
  const trimmedKey = key?.trim();
  if (entry.keyField && !trimmedKey && !entry.requiresKey) {
    // Optional key: strip the query parameter that would carry it
    url = url.replace(new RegExp(`[?&][^=&]+=\\{${entry.keyField}\\}`), '');
  }
  const subs = raw.subdomains;
  const firstSub = Array.isArray(subs) ? subs[0] : typeof subs === 'string' ? subs.charAt(0) : 'a';
  url = url.replace(/\{s\}/g, firstSub || 'a').replace(/\{r\}/g, '');
  url = url.replace(/\{([A-Za-z_][\w]*)\}/g, (match, name: string) => {
    if (name === 'z' || name === 'x' || name === 'y') return match;
    if (name === entry.keyField) return trimmedKey ? encodeURIComponent(trimmedKey) : match;
    const v = raw[name];
    return typeof v === 'string' || typeof v === 'number' ? String(v) : match;
  });
  return url;
};

/** Tile containing `center` ([lng, lat]) at `zoom`. */
export const tileFor = (center: [number, number], zoom: number) => {
  const [lng, lat] = center;
  const n = 2 ** zoom;
  const x = Math.min(n - 1, Math.max(0, Math.floor(((lng + 180) / 360) * n)));
  const rad = (Math.max(-85, Math.min(85, lat)) * Math.PI) / 180;
  const y = Math.min(n - 1, Math.max(0, Math.floor(((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n)));
  return { x, y, z: zoom };
};

export const previewTileUrl = (template: string, center: [number, number], zoom = 4): string => {
  const { x, y, z } = tileFor(center, zoom);
  return template.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y));
};

export const toBaseLayer = (
  entry: GalleryEntry,
  opts: { key?: string; center: [number, number]; isActive?: boolean },
): DataSource => {
  const url = resolveTemplate(entry, opts.key);
  const previewZoom = Math.max(entry.minZoom ?? 0, Math.min(entry.maxZoom ?? 4, 4));
  const item: Record<string, unknown> = { format: 'xyz', url, zIndex: 0 };
  if (entry.minZoom !== undefined) item.minZoom = entry.minZoom;
  if (entry.maxZoom !== undefined) item.maxZoom = entry.maxZoom;
  return {
    name: entry.name,
    isActive: !!opts.isActive,
    isBaseLayer: true,
    preview: previewTileUrl(url, opts.center, previewZoom),
    meta: {
      description: '',
      attribution: {
        text: entry.attributionText || entry.provider,
        ...(entry.attributionUrl && { url: entry.attributionUrl }),
      },
    },
    data: [item],
    exclusivitySets: [],
  } as unknown as DataSource;
};

let cache: Promise<GalleryEntry[]> | null = null;

export const fetchXyzProviders = (): Promise<GalleryEntry[]> => {
  if (!cache) {
    cache = (async () => {
      let url = XYZ_PROVIDERS_URL;
      try {
        const manifest: any = await fetchExampleManifest();
        if (manifest?.recommended?.basemapRegistry?.url) url = manifest.recommended.basemapRegistry.url;
      } catch {
        /* use default */
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to load basemap registry: ${res.statusText}`);
      return flattenProviders(await res.json());
    })();
    cache.catch(() => { cache = null; });
  }
  return cache;
};
