import { ServiceCapabilities } from '@/types/config';

export interface StacCapabilitiesMetrics {
  capabilities: ServiceCapabilities | null;
  title?: string;
  durationMs?: number;
  bytes?: number;
}

const measureFetch = async (url: string): Promise<{ res: Response; text: string; durationMs: number; bytes: number }> => {
  const start = performance.now();
  const res = await fetch(url);
  const text = await res.text();
  const durationMs = performance.now() - start;
  const headerLen = Number(res.headers.get('Content-Length'));
  const bytes = Number.isFinite(headerLen) && headerLen > 0 ? headerLen : text.length;
  return { res, text, durationMs, bytes };
};

/**
 * Pure STAC catalogue capabilities fetcher with timing/size metrics.
 * Detects openEO job-result style responses (top-level "assets") and falls back
 * to a standard STAC Catalog by fetching `/collections?limit=100`.
 */
export async function fetchStacCapabilitiesWithMetrics(
  url: string,
): Promise<StacCapabilitiesMetrics> {
  try {
    const ensureSlash = (u: string) => (u.endsWith('/') ? u : u + '/');

    const root = await measureFetch(url);
    const rootJson = JSON.parse(root.text);

    // openEO job results: top-level "assets" object
    if (rootJson?.assets && typeof rootJson.assets === 'object') {
      const assetCount = Object.keys(rootJson.assets).length;
      const title = rootJson.title || rootJson.id || 'STAC Assets';
      return {
        capabilities: {
          layers: [
            {
              name: 'assets',
              title: `Assets (${assetCount})`,
              abstract: 'Direct STAC assets response (openEO job results)',
            },
          ],
          title: rootJson.title,
          abstract: rootJson.description,
          totalCount: assetCount,
        },
        title,
        durationMs: root.durationMs,
        bytes: root.bytes,
      };
    }

    // Standard STAC catalog: fetch /collections
    const baseUrl = new URL(url);
    baseUrl.search = '';
    baseUrl.hash = '';
    const collectionsUrl = ensureSlash(baseUrl.toString()) + 'collections?limit=100';
    const coll = await measureFetch(collectionsUrl);
    const collectionsJson = JSON.parse(coll.text);

    const catalogue = rootJson;
    const title = catalogue.title || catalogue.id || 'STAC Catalogue';
    const collections = collectionsJson.collections || collectionsJson;
    const totalCollections =
      collectionsJson.numberMatched !== undefined
        ? collectionsJson.numberMatched
        : Array.isArray(collections)
          ? collections.length
          : 0;

    let layers: any[] = [];
    if (Array.isArray(collections)) {
      layers = collections.map((c: any) => ({
        name: c.id || c.title,
        title: c.title || c.id,
        abstract: c.description || 'STAC Collection',
      }));
    }

    return {
      capabilities: {
        layers,
        title: catalogue.title,
        abstract: catalogue.description,
        totalCount: totalCollections,
      },
      title,
      // Combined duration/bytes across both fetches give a useful upper bound.
      durationMs: root.durationMs + coll.durationMs,
      bytes: root.bytes + coll.bytes,
    };
  } catch (error) {
    console.error('Error fetching STAC catalogue:', error);
    return { capabilities: null };
  }
}

/**
 * Backward-compatible wrapper used by all existing call sites.
 */
export async function fetchStacCapabilities(
  url: string,
): Promise<{ capabilities: ServiceCapabilities | null; title?: string }> {
  const { capabilities, title } = await fetchStacCapabilitiesWithMetrics(url);
  return { capabilities, title };
}
