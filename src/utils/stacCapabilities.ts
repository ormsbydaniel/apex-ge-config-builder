import { ServiceCapabilities } from '@/types/config';
import {
  ProbeDiagnostic,
  classifyFetchError,
  classifyHttpResponse,
} from '@/utils/serviceDiagnostics';

export interface StacCapabilitiesMetrics {
  capabilities: ServiceCapabilities | null;
  title?: string;
  /** Present when capabilities is null (failure) or empty (warning). */
  diagnostic?: ProbeDiagnostic;
  durationMs?: number;
  bytes?: number;
}

interface MeasuredFetch {
  res: Response;
  text: string;
  durationMs: number;
  bytes: number;
}

const measureFetch = async (url: string): Promise<MeasuredFetch> => {
  const start = performance.now();
  const res = await fetch(url);
  const text = await res.text();
  const durationMs = performance.now() - start;
  const headerLen = Number(res.headers.get('Content-Length'));
  const bytes = Number.isFinite(headerLen) && headerLen > 0 ? headerLen : text.length;
  return { res, text, durationMs, bytes };
};

const failure = (
  diagnostic: ProbeDiagnostic,
  durationMs?: number,
  bytes?: number,
): StacCapabilitiesMetrics => ({ capabilities: null, diagnostic, durationMs, bytes });

/**
 * Pure STAC catalogue capabilities fetcher with timing/size metrics + diagnostics.
 * Detects openEO job-result style responses (top-level "assets") and falls back
 * to a standard STAC Catalog by fetching `/collections?limit=100`.
 */
export async function fetchStacCapabilitiesWithMetrics(
  url: string,
): Promise<StacCapabilitiesMetrics> {
  const ensureSlash = (u: string) => (u.endsWith('/') ? u : u + '/');

  // 1. URL syntax
  try {
    new URL(url);
  } catch {
    return failure({
      category: 'invalid-url',
      title: 'URL is not well-formed',
      hint: 'Check for typos and that the address starts with http:// or https://',
    });
  }

  // 2. Root catalogue fetch
  let root: MeasuredFetch;
  const rootStart = performance.now();
  try {
    root = await measureFetch(url);
  } catch (err) {
    return failure(
      classifyFetchError(err, { url, durationMs: performance.now() - rootStart }),
    );
  }

  const rootHttp = classifyHttpResponse(root.res, { expectedKind: 'json', durationMs: root.durationMs });
  if (rootHttp) return failure(rootHttp, root.durationMs, root.bytes);

  let rootJson: any;
  try {
    rootJson = JSON.parse(root.text);
  } catch {
    return failure(
      {
        category: 'parse-json',
        title: `Response wasn't valid JSON`,
        hint: 'The URL may not be a STAC catalogue or collection endpoint.',
        durationMs: root.durationMs,
      },
      root.durationMs,
      root.bytes,
    );
  }

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

  // Single Collection — the URL points at a leaf collection.json, not a catalog.
  if (rootJson?.type === 'Collection') {
    const name = rootJson.id || rootJson.title || 'collection';
    const title = rootJson.title || rootJson.id || 'STAC Collection';
    return {
      capabilities: {
        layers: [{
          name,
          title,
          abstract: rootJson.description || 'STAC Collection',
        }],
        title: rootJson.title,
        abstract: rootJson.description,
        totalCount: 1,
      },
      title,
      durationMs: root.durationMs,
      bytes: root.bytes,
    };
  }

  // Detect whether this Catalog is also a STAC API (exposes /collections).
  const conformsTo: unknown = rootJson?.conformsTo;
  const isStacApi =
    Array.isArray(conformsTo) &&
    conformsTo.some(
      (c: unknown) =>
        typeof c === 'string' &&
        /stacspec\.org\/.+\/(core|collections|item-search|ogcapi-features)/.test(c),
    );

  // Static STAC Catalog — enumerate children from rootJson.links[rel=child].
  if (!isStacApi) {
    const childLinks: any[] = Array.isArray(rootJson?.links)
      ? rootJson.links.filter((l: any) => l && l.rel === 'child')
      : [];

    if (childLinks.length > 0) {
      const baseHref = url;
      const layers = childLinks.map((l: any) => {
        const href: string = l.href || '';
        let name = l.id || l.title;
        if (!name) {
          try {
            const abs = new URL(href, baseHref);
            const parts = abs.pathname.split('/').filter(Boolean);
            name = parts[parts.length - 2] || parts[parts.length - 1] || href;
          } catch {
            name = href || 'collection';
          }
        }
        return {
          name,
          title: l.title || name,
          abstract: 'STAC Collection',
        };
      });
      return {
        capabilities: {
          layers,
          title: rootJson.title,
          abstract: rootJson.description,
          totalCount: layers.length,
        },
        title: rootJson.title || rootJson.id || 'STAC Catalogue',
        durationMs: root.durationMs,
        bytes: root.bytes,
      };
    }
    // No conformance hints AND no child links — fall through to the
    // /collections probe; if that 404s we'll downgrade to an 'empty' diagnostic.
  }

  // Standard STAC API: fetch /collections
  const baseUrl = new URL(url);
  baseUrl.search = '';
  baseUrl.hash = '';
  const collectionsUrl = ensureSlash(baseUrl.toString()) + 'collections?limit=100';

  let coll: MeasuredFetch;
  const collStart = performance.now();
  try {
    coll = await measureFetch(collectionsUrl);
  } catch (err) {
    if (!isStacApi) {
      return {
        capabilities: { layers: [], title: rootJson.title, abstract: rootJson.description, totalCount: 0 },
        title: rootJson.title || rootJson.id || 'STAC Catalogue',
        diagnostic: {
          category: 'empty',
          title: 'Catalogue reachable but no collections discoverable',
          hint: 'The root has no child links and /collections is unreachable.',
          durationMs: root.durationMs,
        },
        durationMs: root.durationMs,
        bytes: root.bytes,
      };
    }
    return failure(
      classifyFetchError(err, { url: collectionsUrl, durationMs: performance.now() - collStart }),
      root.durationMs,
      root.bytes,
    );
  }

  const collHttp = classifyHttpResponse(coll.res, { expectedKind: 'json', durationMs: coll.durationMs });
  if (collHttp) {
    if (!isStacApi) {
      return {
        capabilities: { layers: [], title: rootJson.title, abstract: rootJson.description, totalCount: 0 },
        title: rootJson.title || rootJson.id || 'STAC Catalogue',
        diagnostic: {
          category: 'empty',
          title: 'Catalogue reachable but no collections discoverable',
          hint: 'The root has no child links and /collections is not a valid endpoint.',
          durationMs: root.durationMs + coll.durationMs,
        },
        durationMs: root.durationMs + coll.durationMs,
        bytes: root.bytes + coll.bytes,
      };
    }
    return failure(collHttp, root.durationMs + coll.durationMs, root.bytes + coll.bytes);
  }

  let collectionsJson: any;
  try {
    collectionsJson = JSON.parse(coll.text);
  } catch {
    return failure(
      {
        category: 'parse-json',
        title: `Collections endpoint did not return valid JSON`,
        hint: 'The catalogue root looks valid but /collections is not — verify it is a STAC API.',
        durationMs: coll.durationMs,
      },
      root.durationMs + coll.durationMs,
      root.bytes + coll.bytes,
    );
  }

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

  const durationMs = root.durationMs + coll.durationMs;
  const bytes = root.bytes + coll.bytes;

  const diagnostic: ProbeDiagnostic | undefined = layers.length === 0
    ? {
        category: 'empty',
        title: 'Catalogue reachable but no collections were advertised',
        hint: 'Confirm the URL points at a STAC catalogue with public collections.',
        durationMs,
      }
    : undefined;

  return {
    capabilities: {
      layers,
      title: catalogue.title,
      abstract: catalogue.description,
      totalCount: totalCollections,
    },
    title,
    diagnostic,
    durationMs,
    bytes,
  };
}

/**
 * Backward-compatible wrapper used by existing call sites that don't need
 * metrics or diagnostics.
 */
export async function fetchStacCapabilities(
  url: string,
): Promise<{ capabilities: ServiceCapabilities | null; title?: string; diagnostic?: ProbeDiagnostic }> {
  const { capabilities, title, diagnostic } = await fetchStacCapabilitiesWithMetrics(url);
  return { capabilities, title, diagnostic };
}
