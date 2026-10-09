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

/** Picks the most meaningful branch from anyOf/oneOf (e.g. [{number},{null}] → the number branch). */
function resolveUnionBranch(p: any): any {
  const branches = p?.anyOf ?? p?.oneOf;
  if (!Array.isArray(branches)) return p;
  const meaningful = branches.filter((b) => b && b.type !== 'null');
  return meaningful.length === 1 ? { ...p, ...meaningful[0] } : p;
}

const STAC_DATETIME_FIELDS = new Set(['datetime', 'created', 'updated', 'start_datetime', 'end_datetime', 'published', 'expires']);
const STAC_INTEGER_FIELDS = new Set(['sat:relative_orbit', 'sat:absolute_orbit', 'proj:epsg', 'landsat:wrs_path', 'landsat:wrs_row']);
const STAC_PERCENT_FIELDS = new Set(['eo:cloud_cover', 'eo:snow_cover', 'cloud_cover']);
const STAC_NUMBER_FIELDS = new Set(['gsd', 'view:off_nadir', 'view:incidence_angle', 'view:azimuth', 'view:sun_azimuth', 'view:sun_elevation']);

/**
 * Infers a type for well-known STAC fields referenced via `$ref` (e.g. the eo
 * extension's `eo:cloud_cover`), since many APIs point at shared schemas instead
 * of inlining a type. Returns undefined for unrecognised references.
 */
function inferFromStacRef(ref: string, key: string): { type: string; format?: string; minimum?: number; maximum?: number } | undefined {
  const field = ref.split('/').pop() ?? '';
  const names = [field, key];
  if (names.some((n) => STAC_DATETIME_FIELDS.has(n))) return { type: 'string', format: 'date-time' };
  if (names.some((n) => STAC_PERCENT_FIELDS.has(n) || /_percentage$/.test(n))) return { type: 'number', minimum: 0, maximum: 100 };
  if (names.some((n) => STAC_INTEGER_FIELDS.has(n))) return { type: 'integer' };
  if (names.some((n) => STAC_NUMBER_FIELDS.has(n))) return { type: 'number' };
  if (['id', 'collection', 'platform', 'constellation', 'mission'].includes(field)) return { type: 'string' };
  return undefined;
}

/** Converts a queryables JSON Schema into a sorted, display-friendly list. */
export function summariseStacQueryables(schema: any): StacQueryable[] {
  const props = schema?.properties;
  if (!props || typeof props !== 'object') return [];
  return Object.entries<any>(props)
    .map(([key, raw]) => {
      let p = resolveUnionBranch(raw);
      if (p?.$ref && p?.type === undefined) {
        const inferred = inferFromStacRef(String(p.$ref), key);
        if (inferred) p = { ...inferred, ...p, type: inferred.type };
      }
      let type: string = Array.isArray(p?.type) ? p.type.filter((t: string) => t !== 'null').join(' | ')
        : p?.type ?? (p?.$ref ? 'reference' : 'any');
      if (p?.format) type = `${type} (${p.format})`;
      const enumValues = Array.isArray(p?.enum) ? p.enum : p?.const !== undefined ? [p.const] : undefined;
      const range = p?.minimum !== undefined || p?.maximum !== undefined
        ? `${p.minimum ?? '−∞'} – ${p.maximum ?? '∞'}` : undefined;
      return { key, title: p?.title, description: p?.description, type, enumValues, range };
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
