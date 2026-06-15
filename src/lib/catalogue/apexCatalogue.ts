import type { CatalogueEntry, CatalogueRecord, MappedWorkflowFields } from './types';

const REPO_OWNER = 'ESA-APEx';
const REPO_NAME = 'apex_algorithms';
const BRANCH = 'main';
const CATALOG_PREFIX = 'algorithm_catalog/';

// Match algorithm record files: algorithm_catalog/<provider>/<algorithm>/records/<algorithm>.json
const RECORD_PATH_RE = /^algorithm_catalog\/([^/]+)\/([^/]+)\/records\/\2\.json$/;

interface TreeEntry { path: string; type: string }
interface TreeResponse { tree: TreeEntry[]; truncated: boolean }

let cachedEntries: CatalogueEntry[] | null = null;
let inflight: Promise<CatalogueEntry[]> | null = null;

export function getCachedEntries(): CatalogueEntry[] | null {
  return cachedEntries;
}

export async function loadCatalogue(): Promise<CatalogueEntry[]> {
  if (cachedEntries) return cachedEntries;
  if (inflight) return inflight;
  inflight = (async () => {
    const treeUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/${BRANCH}?recursive=1`;
    const treeRes = await fetch(treeUrl, { headers: { Accept: 'application/vnd.github+json' } });
    if (!treeRes.ok) throw new Error(`Failed to fetch repo tree (${treeRes.status})`);
    const tree = (await treeRes.json()) as TreeResponse;

    const paths: Array<{ provider: string; algorithmId: string; path: string }> = [];
    for (const entry of tree.tree) {
      if (entry.type !== 'blob') continue;
      const m = entry.path.match(RECORD_PATH_RE);
      if (!m) continue;
      paths.push({ provider: m[1], algorithmId: m[2], path: entry.path });
    }

    const results: CatalogueEntry[] = [];
    const CONCURRENCY = 10;
    for (let i = 0; i < paths.length; i += CONCURRENCY) {
      const slice = paths.slice(i, i + CONCURRENCY);
      const batch = await Promise.all(
        slice.map(async (p) => {
          try {
            const rawUrl = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${p.path}`;
            const res = await fetch(rawUrl);
            if (!res.ok) return null;
            const record = (await res.json()) as CatalogueRecord;
            const name = record.properties?.title?.trim() || record.id || p.algorithmId;
            const description = record.properties?.description?.trim() || '';
            return {
              provider: p.provider,
              algorithmId: p.algorithmId,
              name,
              description,
              path: p.path,
              record,
            } as CatalogueEntry;
          } catch {
            return null;
          }
        })
      );
      for (const r of batch) if (r) results.push(r);
    }

    results.sort((a, b) => a.name.localeCompare(b.name));
    cachedEntries = results;
    return results;
  })();
  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

const OPENEO_UDP_URI = 'https://apex.esa.int/core/openeo-udp';
const OGC_PROCESSES_URI = 'https://apex.esa.int/core/ogc-api-processes';

function findLink(record: CatalogueRecord, rel: string): string | undefined {
  return record.links?.find((l) => l.rel === rel)?.href;
}

export function mapRecordToWorkflowFields(entry: CatalogueEntry): MappedWorkflowFields {
  const { record, provider } = entry;
  const conformsTo = record.conformsTo ?? [];
  const serviceHref = findLink(record, 'service') ?? '';
  const applicationHref = findLink(record, 'application') ?? '';

  const out: MappedWorkflowFields = {
    serviceId: record.id || entry.algorithmId,
    serviceProvider: provider,
  };

  if (conformsTo.includes(OGC_PROCESSES_URI)) {
    // OGC API – Processes: endpoint is base, application is last path segment of service href
    let endpoint = serviceHref;
    let application = '';
    try {
      const u = new URL(serviceHref);
      const parts = u.pathname.split('/').filter(Boolean);
      // Expect .../processes/<id>
      if (parts.length >= 2 && parts[parts.length - 2] === 'processes') {
        application = parts[parts.length - 1];
        const baseParts = parts.slice(0, -2);
        u.pathname = '/' + baseParts.join('/');
        endpoint = u.toString().replace(/\/$/, '');
      } else {
        application = parts[parts.length - 1] ?? '';
      }
    } catch {
      // leave as-is
    }
    out.serviceDetails = {
      endpoint,
      ...(applicationHref && { namespace: applicationHref }),
      ...(application && { application }),
    };
  } else if (conformsTo.includes(OPENEO_UDP_URI) || serviceHref || applicationHref) {
    // openEO UDP (default fallback when we have any service info)
    out.serviceDetails = {
      endpoint: serviceHref,
      ...(applicationHref && { namespace: applicationHref }),
      application: record.id || entry.algorithmId,
    };
  }

  return out;
}
