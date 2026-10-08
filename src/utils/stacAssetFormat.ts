/**
 * STAC data sources only store an items/collection URL plus optional asset
 * names. These helpers detect the asset's real format from one sample item,
 * so format-dependent tools (COG, vector, CSV) can be gated on it.
 * Single renderable asset per STAC data source: the first named asset wins.
 */
import { appendQueryParam, detectAssetFormat, extractBandLabels, resolveAssetUrl, type StacAsset } from '@/utils/stacUtils';
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

/** Format used for feature gating: the detected asset format for STAC sources. */
export function getEffectiveFormat(item: Pick<DataSourceItem, 'format'> & { assetFormat?: string }): string {
  if (item.format === 'stac') return item.assetFormat || 'stac';
  return item.format;
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
