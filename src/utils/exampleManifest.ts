/**
 * Loads the manifest of remotely-hosted example configurations and
 * recommended-resource references from the
 * ESA-APEx/apex_geospatial_explorer_configs repository. This lets new
 * examples / recommended files be added without redeploying the config
 * builder.
 */

export const EXAMPLES_REPO = 'ESA-APEx/apex_geospatial_explorer_configs';
export const EXAMPLES_BRANCH = 'main';
export const EXAMPLES_DIR = 'config-builder';

export const EXAMPLES_MANIFEST_URL = `https://raw.githubusercontent.com/${EXAMPLES_REPO}/${EXAMPLES_BRANCH}/${EXAMPLES_DIR}/manifest.json`;

export interface ExampleConfigEntry {
  id: string;
  name: string;
  description: string;
  /** Fully-resolved raw URL to the JSON config. */
  url: string;
  /** Filename used in toasts / error dialogs. */
  fileName: string;
}

export interface RecommendedResourceEntry {
  /** Fully-resolved raw URL to the JSON resource file. */
  url: string;
}

export interface RecommendedCatalogueEntry {
  id: string;
  name: string;
  description?: string;
  url: string;
}

export interface ExampleManifest {
  examples: ExampleConfigEntry[];
  recommended: {
    basemaps?: RecommendedResourceEntry;
    services?: RecommendedResourceEntry;
    catalogues?: RecommendedCatalogueEntry[];
  };
}


interface RawManifestEntry {
  id?: unknown;
  name?: unknown;
  description?: unknown;
  file?: unknown;
  url?: unknown;
}

interface RawRecommendedEntry {
  file?: unknown;
  url?: unknown;
}

interface RawManifest {
  version?: unknown;
  examples?: unknown;
  recommended?: unknown;
}

const baseUrl = `https://raw.githubusercontent.com/${EXAMPLES_REPO}/${EXAMPLES_BRANCH}/${EXAMPLES_DIR}/`;

const isNonEmptyString = (v: unknown): v is string =>
  typeof v === 'string' && v.trim().length > 0;

/**
 * Resolve a manifest reference (`file` relative to `config-builder/`, or
 * absolute `url`) into a fully-qualified URL. `file` paths may traverse up
 * (e.g. `../resources/foo.json`) — those are normalised against `baseUrl`.
 */
const resolveRef = (raw: { file?: unknown; url?: unknown }): string | null => {
  if (isNonEmptyString(raw.url)) return raw.url;
  if (isNonEmptyString(raw.file)) {
    try {
      return new URL(raw.file, baseUrl).toString();
    } catch {
      return baseUrl + raw.file.replace(/^\//, '');
    }
  }
  return null;
};

const parseEntry = (raw: RawManifestEntry, index: number): ExampleConfigEntry | null => {
  if (!isNonEmptyString(raw.name) || !isNonEmptyString(raw.description)) return null;

  const url = resolveRef(raw);
  if (!url) return null;

  let fileName: string;
  try {
    fileName = new URL(url).pathname.split('/').pop() || url;
  } catch {
    fileName = url;
  }

  const id = isNonEmptyString(raw.id) ? raw.id : `example-${index}`;
  return { id, name: raw.name, description: raw.description, url, fileName };
};

const parseRecommendedEntry = (raw: unknown): RecommendedResourceEntry | undefined => {
  if (!raw || typeof raw !== 'object') return undefined;
  const url = resolveRef(raw as RawRecommendedEntry);
  return url ? { url } : undefined;
};

let cache: Promise<ExampleManifest> | null = null;

export const fetchExampleManifest = async (
  { force = false }: { force?: boolean } = {},
): Promise<ExampleManifest> => {
  if (!force && cache) return cache;

  const run = (async () => {
    const res = await fetch(EXAMPLES_MANIFEST_URL, { cache: 'no-cache' });
    if (!res.ok) {
      throw new Error(`Failed to fetch examples manifest (HTTP ${res.status})`);
    }
    let raw: RawManifest;
    try {
      raw = await res.json();
    } catch (e: any) {
      throw new Error(`Manifest is not valid JSON: ${e?.message || 'parse error'}`);
    }
    if (!raw || !Array.isArray(raw.examples)) {
      throw new Error('Manifest is missing an "examples" array');
    }
    const examples = (raw.examples as RawManifestEntry[])
      .map((e, i) => parseEntry(e, i))
      .filter((e): e is ExampleConfigEntry => e !== null);

    const rec = (raw.recommended ?? {}) as Record<string, unknown>;
    const recommended = {
      basemaps: parseRecommendedEntry(rec.basemaps),
      services: parseRecommendedEntry(rec.services),
    };

    return { examples, recommended } satisfies ExampleManifest;
  })();

  cache = run.catch((e) => {
    cache = null;
    throw e;
  });
  return cache;
};

export const clearExampleManifestCache = () => {
  cache = null;
};

/**
 * Convenience: fetch just the examples list (kept for the Load Configuration
 * / Donor pickers which don't care about recommended resources).
 */
export const fetchExamples = async (): Promise<ExampleConfigEntry[]> => {
  const m = await fetchExampleManifest();
  return m.examples;
};
