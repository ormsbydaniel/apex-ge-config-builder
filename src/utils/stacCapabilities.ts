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

  // Standard STAC catalog: fetch /collections
  const baseUrl = new URL(url);
  baseUrl.search = '';
  baseUrl.hash = '';
  const collectionsUrl = ensureSlash(baseUrl.toString()) + 'collections?limit=100';

  let coll: MeasuredFetch;
  const collStart = performance.now();
  try {
    coll = await measureFetch(collectionsUrl);
  } catch (err) {
    return failure(
      classifyFetchError(err, { url: collectionsUrl, durationMs: performance.now() - collStart }),
      root.durationMs,
      root.bytes,
    );
  }

  const collHttp = classifyHttpResponse(coll.res, { expectedKind: 'json', durationMs: coll.durationMs });
  if (collHttp) return failure(collHttp, root.durationMs + coll.durationMs, root.bytes + coll.bytes);

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
