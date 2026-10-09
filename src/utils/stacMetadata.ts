/**
 * Read-only STAC metadata lookups for the row (i) dialog.
 * Nothing returned here is ever written to the saved configuration.
 */

/** Derives `.../collections/{id}` from an item, items or collection URL. */
export function getStacCollectionUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const m = u.pathname.match(/^(.*\/collections\/[^/]+)/);
    if (!m) return null;
    return `${u.origin}${m[1]}`;
  } catch {
    return null;
  }
}

/** True when the URL points at a single item (`/items/{id}`). */
export function isStacSingleItemUrl(url: string): boolean {
  try {
    return /\/items\/[^/]+\/?$/.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

/** Removes query strings (signing tokens) for display. */
export function stripUrlParams(href: string): string {
  try {
    const u = new URL(href);
    return `${u.origin}${u.pathname}`;
  } catch {
    return href.split('?')[0];
  }
}

type Fetcher = (url: string) => Promise<{ ok: boolean; status?: number; json: () => Promise<any> }>;
const defaultFetch: Fetcher = (url) => fetch(url) as any;

async function getJson(url: string, fetcher: Fetcher) {
  const res = await fetcher(url);
  if (!res.ok) throw new Error(`Request failed (${res.status ?? 'error'})`);
  return res.json();
}

export async function fetchStacCollection(url: string, fetcher: Fetcher = defaultFetch) {
  const collectionUrl = getStacCollectionUrl(url);
  if (!collectionUrl) return null;
  return getJson(collectionUrl, fetcher);
}

export interface StacQueryable {
  key: string;
  title?: string;
  description?: string;
  type: string;
  enumValues?: unknown[];
  range?: string;
}

/** Converts a queryables JSON Schema into a sorted, display-friendly list. */
export function summariseStacQueryables(schema: any): StacQueryable[] {
  const props = schema?.properties;
  if (!props || typeof props !== 'object') return [];
  return Object.entries<any>(props)
    .map(([key, p]) => {
      let type: string = Array.isArray(p?.type) ? p.type.join(' | ')
        : p?.type ?? (p?.$ref ? 'reference' : p?.oneOf || p?.anyOf ? 'union' : 'any');
      if (p?.format) type = `${type} (${p.format})`;
      const range = p?.minimum !== undefined || p?.maximum !== undefined
        ? `${p.minimum ?? '−∞'} – ${p.maximum ?? '∞'}` : undefined;
      return { key, title: p?.title, description: p?.description, type, enumValues: Array.isArray(p?.enum) ? p.enum : undefined, range };
    })
    .sort((a, b) => a.key.localeCompare(b.key));
}

/** Fetches `{collection}/queryables`; null when the collection can't be derived. */
export async function fetchStacQueryables(url: string, fetcher: Fetcher = defaultFetch) {
  const collectionUrl = getStacCollectionUrl(url);
  if (!collectionUrl) return null;
  const res = await fetcher(`${collectionUrl}/queryables`);
  if (res.status === 404) throw new Error('This collection does not publish queryables.');
  if (!res.ok) throw new Error(`Request failed (${res.status ?? 'error'})`);
  return res.json();
}

const queryablesCache = new Map<string, Promise<any>>();

/** Session cache keyed by collection URL; failed requests are not cached. */
export function getCachedStacQueryables(url: string): Promise<any> {
  const key = getStacCollectionUrl(url);
  if (!key) return Promise.resolve(null);
  let pending = queryablesCache.get(key);
  if (!pending) {
    pending = fetchStacQueryables(url).catch((error) => {
      queryablesCache.delete(key);
      throw error;
    });
    queryablesCache.set(key, pending);
  }
  return pending;
}

export interface StacItemSample {
  item: any | null;
  /** Number of items returned by the items endpoint (undefined for single items). */
  returned?: number;
  matched?: number;
  single: boolean;
}

export async function fetchStacItemSample(url: string, fetcher: Fetcher = defaultFetch): Promise<StacItemSample> {
  const json = await getJson(url, fetcher);
  if (json?.type === 'Feature' || isStacSingleItemUrl(url)) {
    return { item: json, single: true };
  }
  const features = Array.isArray(json?.features) ? json.features : [];
  return {
    item: features[0] ?? null,
    returned: json?.numberReturned ?? features.length,
    matched: json?.numberMatched ?? json?.context?.matched,
    single: false,
  };
}
