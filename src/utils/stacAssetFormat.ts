/**
 * STAC data sources only store an items/collection URL plus optional asset
 * names. These helpers detect the asset's real format from one sample item,
 * so format-dependent tools (COG, vector, CSV) can be gated on it.
 * The current editor exposes one asset, while the saved contract can describe
 * multiple assets and their formats by name.
 */
import { appendQueryParam, detectAssetFormat, extractBandLabels, resolveAssetUrl, type StacAsset } from '@/utils/stacUtils';
import { detectFieldsFromSource, isVectorFormat, type DetectedField } from '@/utils/fieldDetection';
import type { DataSourceItem } from '@/types/config';

export const STAC_ASSET_FORMATS = ['cog', 'geojson', 'flatgeobuf', 'csv', 'xyz'] as const;
export type StacAssetFormat = typeof STAC_ASSET_FORMATS[number];

export interface StacSample {
  format?: StacAssetFormat;
  /** Resolved href of the sample asset — session-only, never saved. */
  sampleUrl?: string;
  bandLabels?: string[];
  assetName?: string;
}

/** Format used for feature gating: the selected asset's mapped format for STAC sources. */
export function getEffectiveFormat(
  item: Pick<DataSourceItem, 'format' | 'assets' | 'assetFormats'>,
  assetName?: string,
): string {
  if (item.format === 'stac') {
    const name = assetName ?? item.assets?.[0];
    return (name ? item.assetFormats?.[name] : undefined) || 'stac';
  }
  return item.format;
}

/** True when the item's effective format is a vector format (incl. mapped STAC assets). */
export function isVectorDataSource(
  item: Pick<DataSourceItem, 'format' | 'assets' | 'assetFormats'>,
): boolean {
  const format = getEffectiveFormat(item);
  return !!format && isVectorFormat(format);
}

export interface DataSourceInspectionAccess {
  format: string;
  url: string;
}

/**
 * Resolves the URL and format a format-specific inspection tool should use.
 * STAC asset hrefs are deliberately returned only in memory and must never be
 * copied onto the saved data-source item.
 */
export async function resolveDataSourceInspectionAccess(
  item: Pick<DataSourceItem, 'format' | 'url' | 'assets' | 'assetFormats'>,
): Promise<DataSourceInspectionAccess | null> {
  if (!item.url) return null;
  const format = getEffectiveFormat(item);
  if (item.format !== 'stac') return format ? { format, url: item.url } : null;
  if (format === 'stac') return null;

  const sample = await getStacSample(item.url, item.assets);
  return sample.sampleUrl ? { format, url: sample.sampleUrl } : null;
}

/**
 * Detects attribute fields for a data item, resolving STAC items to their
 * in-memory sample asset URL first. Resolved URLs are never persisted.
 */
export async function detectFieldsFromDataSource(
  item: Pick<DataSourceItem, 'url' | 'format' | 'assets' | 'assetFormats'>,
): Promise<DetectedField[]> {
  const access = await resolveDataSourceInspectionAccess(item);
  if (!access) return [];
  return detectFieldsFromSource(access.url, access.format);
}

/** Returns a new format map with one named entry set or removed. */
export function updateStacAssetFormatMap(
  current: DataSourceItem['assetFormats'] | undefined,
  assetName: string | undefined,
  format: StacAssetFormat | undefined,
): DataSourceItem['assetFormats'] | undefined {
  if (!assetName) return current;
  const next = { ...current };
  if (format) next[assetName] = format;
  else delete next[assetName];
  return Object.keys(next).length > 0 ? next : undefined;
}

type FetchLike = (url: string, init?: RequestInit) => Promise<{ ok: boolean; status?: number; json: () => Promise<any> }>;

const withLimit = (url: string) => (/[?&]limit=/.test(url) ? url : appendQueryParam(url, 'limit', 1));

async function getJson(url: string, fetcher: FetchLike) {
  const res = await fetcher(url, { headers: { Accept: 'application/geo+json, application/json' } });
  if (!res.ok) throw new Error(`STAC request failed (${res.status ?? 'error'}) for ${url}`);
  return res.json();
}

/** Finds one sample item from an items endpoint, a collection, or a single item. */
async function fetchSampleItem(url: string, fetcher: FetchLike): Promise<{ item: any; baseUrl: string } | null> {
  const isItems = /\/items\/?(\?|$)/.test(url) || /[?&](limit|bbox|datetime)=/.test(url);
  const data = await getJson(isItems ? withLimit(url) : url, fetcher);
  if (data?.type === 'Feature' && data.assets) return { item: data, baseUrl: url };
  if (Array.isArray(data?.features)) return data.features[0] ? { item: data.features[0], baseUrl: url } : null;
  const links: Array<{ rel: string; href: string }> = data?.links || [];
  const itemsLink = links.find((l) => l.rel === 'items');
  if (itemsLink) {
    const itemsUrl = withLimit(resolveAssetUrl(itemsLink.href, url));
    const items = await getJson(itemsUrl, fetcher);
    return items?.features?.[0] ? { item: items.features[0], baseUrl: itemsUrl } : null;
  }
  const itemLink = links.find((l) => l.rel === 'item');
  if (itemLink) {
    const itemUrl = resolveAssetUrl(itemLink.href, url);
    return { item: await getJson(itemUrl, fetcher), baseUrl: itemUrl };
  }
  // Collection-level assets (static collections)
  if (data?.assets) return { item: data, baseUrl: url };
  return null;
}

function toKnownFormat(value: string): StacAssetFormat | undefined {
  return (STAC_ASSET_FORMATS as readonly string[]).includes(value) ? (value as StacAssetFormat) : undefined;
}

export interface StacAssetChoice {
  name: string;
  title?: string;
  format?: StacAssetFormat;
}

/** Lists the assets advertised by the first item (or collection-level assets). */
export async function listStacAssets(
  url: string,
  fetcher: FetchLike = fetch as unknown as FetchLike,
): Promise<StacAssetChoice[]> {
  const sample = await fetchSampleItem(url, fetcher);
  if (!sample) return [];
  const assets: Record<string, StacAsset> = sample.item.assets || {};
  return Object.entries(assets)
    .filter(([, asset]) => asset?.href)
    .map(([name, asset]) => ({
      name,
      title: asset.title,
      format: toKnownFormat(String(detectAssetFormat(asset))),
    }));
}

/** Fetches one sample item and works out the named asset's format. */
export async function sampleStacAsset(
  url: string,
  assetNames: string[] | undefined,
  fetcher: FetchLike = fetch as unknown as FetchLike,
): Promise<StacSample> {
  const sample = await fetchSampleItem(url, fetcher);
  if (!sample) return {};
  const assets: Record<string, StacAsset> = sample.item.assets || {};
  const name = assetNames?.find((n) => assets[n]) ?? (assetNames?.length ? undefined : Object.keys(assets)[0]);
  const asset = name ? assets[name] : undefined;
  if (!asset?.href) return { assetName: name };
  return {
    assetName: name,
    format: toKnownFormat(String(detectAssetFormat(asset))),
    sampleUrl: resolveAssetUrl(asset.href, sample.baseUrl),
    bandLabels: extractBandLabels(asset, sample.item.properties),
  };
}

/** In-memory cache so dialogs can reuse a sample href for the session. */
const sampleCache = new Map<string, Promise<StacSample>>();
export function getStacSample(url: string, assetNames?: string[]): Promise<StacSample> {
  const key = `${url}|${(assetNames || []).join(',')}`;
  let p = sampleCache.get(key);
  if (!p) {
    p = sampleStacAsset(url, assetNames).catch((e) => { sampleCache.delete(key); throw e; });
    sampleCache.set(key, p);
  }
  return p;
}

/**
 * Endpoint identity for automatic asset discovery: the URL without query or
 * fragment, but only when it is an `items` list or a direct `items/{id}` item.
 * Filter edits change only the query, so they keep the same identity.
 */
export function getStacItemEndpointKey(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    const path = parsed.pathname.replace(/\/+$/, '');
    if (!/\/items(\/[^/]+)?$/.test(path)) return null;
    return `${parsed.origin}${path}`;
  } catch {
    return null;
  }
}

export type StacAutoSelection =
  | { kind: 'select'; asset: StacAssetChoice }
  | { kind: 'keep' }
  | { kind: 'choose' }
  | { kind: 'none' };

/** Decides how discovered assets should update the current one-asset selection. */
export function decideStacAutoSelection(assets: StacAssetChoice[], currentName?: string): StacAutoSelection {
  if (assets.length === 0) return { kind: 'none' };
  if (assets.length === 1) return { kind: 'select', asset: assets[0] };
  if (currentName && assets.some((asset) => asset.name === currentName)) return { kind: 'keep' };
  return { kind: 'choose' };
}
