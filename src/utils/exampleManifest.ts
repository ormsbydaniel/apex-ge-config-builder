/**
 * Loads the manifest of remotely-hosted example configurations from the
 * ESA-APEx/apex_geospatial_explorer_configs repository. This lets new
 * examples be added without redeploying the config builder.
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

interface RawManifestEntry {
  id?: unknown;
  name?: unknown;
  description?: unknown;
  file?: unknown;
  url?: unknown;
}

interface RawManifest {
  version?: unknown;
  examples?: unknown;
}

const baseUrl = `https://raw.githubusercontent.com/${EXAMPLES_REPO}/${EXAMPLES_BRANCH}/${EXAMPLES_DIR}/`;

const isNonEmptyString = (v: unknown): v is string =>
  typeof v === 'string' && v.trim().length > 0;

const parseEntry = (raw: RawManifestEntry, index: number): ExampleConfigEntry | null => {
  if (!isNonEmptyString(raw.name) || !isNonEmptyString(raw.description)) return null;

  let url: string | null = null;
  let fileName = '';
  if (isNonEmptyString(raw.url)) {
    url = raw.url;
    try {
      fileName = new URL(raw.url).pathname.split('/').pop() || raw.url;
    } catch {
      fileName = raw.url;
    }
  } else if (isNonEmptyString(raw.file)) {
    url = baseUrl + raw.file.replace(/^\//, '');
    fileName = raw.file.split('/').pop() || raw.file;
  }
  if (!url) return null;

  const id = isNonEmptyString(raw.id) ? raw.id : `example-${index}`;
  return { id, name: raw.name, description: raw.description, url, fileName };
};

let cache: Promise<ExampleConfigEntry[]> | null = null;

export const fetchExampleManifest = async (
  { force = false }: { force?: boolean } = {},
): Promise<ExampleConfigEntry[]> => {
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
    const entries = (raw.examples as RawManifestEntry[])
      .map((e, i) => parseEntry(e, i))
      .filter((e): e is ExampleConfigEntry => e !== null);
    return entries;
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
