import { ServiceCapabilities } from '@/types/config';

/**
 * Pure STAC catalogue capabilities fetcher (no React state, no toasts).
 * Detects openEO job-result style responses (top-level "assets") and falls back
 * to a standard STAC Catalog by fetching `/collections?limit=100`.
 *
 * Returns `{ capabilities, title }` on success; `{ capabilities: null }` on failure.
 */
export async function fetchStacCapabilities(
  url: string,
): Promise<{ capabilities: ServiceCapabilities | null; title?: string }> {
  try {
    const ensureSlash = (u: string) => (u.endsWith('/') ? u : u + '/');

    // Fetch root first to detect openEO job-result vs proper catalog
    const rootRes = await fetch(url);
    const rootJson = await rootRes.json();

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
      };
    }

    // Standard STAC catalog: fetch /collections
    const baseUrl = new URL(url);
    baseUrl.search = '';
    baseUrl.hash = '';
    const collectionsUrl = ensureSlash(baseUrl.toString()) + 'collections?limit=100';
    const collRes = await fetch(collectionsUrl);
    const collectionsJson = await collRes.json();

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
    };
  } catch (error) {
    console.error('Error fetching STAC catalogue:', error);
    return { capabilities: null };
  }
}
