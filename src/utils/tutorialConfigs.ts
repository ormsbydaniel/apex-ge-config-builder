/**
 * Lists tutorial configurations from the `tutorials` folder of the
 * ESA-APEx/apex_geospatial_explorer_configs repository. Files follow the
 * pattern `tutorial-N-completion.json` / `tutorial-N-prerequisite.json`.
 */
import type { ExampleConfigEntry } from './exampleManifest';

export const TUTORIALS_REPO = 'ESA-APEx/apex_geospatial_explorer_configs';
export const TUTORIALS_BRANCH = 'main';
export const TUTORIALS_DIR = 'tutorials';
export const TUTORIALS_LISTING_URL = `https://api.github.com/repos/${TUTORIALS_REPO}/contents/${TUTORIALS_DIR}?ref=${TUTORIALS_BRANCH}`;
export const TUTORIALS_FOLDER_URL = `https://github.com/${TUTORIALS_REPO}/tree/${TUTORIALS_BRANCH}/${TUTORIALS_DIR}`;

export type TutorialKind = 'prerequisite' | 'completion';

export interface TutorialConfigEntry extends ExampleConfigEntry {
  tutorial: number;
  kind: TutorialKind;
}

const PATTERN = /^tutorial-(\d+)-(completion|prerequisite)\.json$/i;

/** Parse listing entries into sorted tutorial configs; non-matching files are ignored. */
export function parseTutorialListing(
  entries: Array<{ name?: unknown; type?: unknown; download_url?: unknown }>,
): TutorialConfigEntry[] {
  const out: TutorialConfigEntry[] = [];
  for (const e of entries) {
    if (typeof e?.name !== 'string' || (e.type !== undefined && e.type !== 'file')) continue;
    const m = PATTERN.exec(e.name);
    if (!m) continue;
    const tutorial = parseInt(m[1], 10);
    const kind = m[2].toLowerCase() as TutorialKind;
    const url = typeof e.download_url === 'string' && e.download_url
      ? e.download_url
      : `https://raw.githubusercontent.com/${TUTORIALS_REPO}/${TUTORIALS_BRANCH}/${TUTORIALS_DIR}/${e.name}`;
    out.push({
      id: `tutorial-${tutorial}-${kind}`,
      tutorial,
      kind,
      name: `Tutorial ${tutorial} ${kind}`,
      description: kind === 'prerequisite'
        ? `Starting point for Tutorial ${tutorial}`
        : `Finished result of Tutorial ${tutorial}`,
      url,
      fileName: e.name,
    });
  }
  return out.sort((a, b) =>
    a.tutorial - b.tutorial || (a.kind === b.kind ? 0 : a.kind === 'prerequisite' ? -1 : 1));
}

let cache: Promise<TutorialConfigEntry[]> | null = null;

export const fetchTutorialConfigs = async (): Promise<TutorialConfigEntry[]> => {
  if (cache) return cache;
  cache = (async () => {
    const res = await fetch(TUTORIALS_LISTING_URL, { headers: { Accept: 'application/vnd.github+json' } });
    if (res.status === 403 || res.status === 429) {
      throw new Error('GitHub rate limit reached — please try again in a few minutes.');
    }
    if (!res.ok) throw new Error(`Failed to list tutorial configurations (HTTP ${res.status})`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('Unexpected response listing the tutorials folder');
    return parseTutorialListing(data);
  })().catch((e) => {
    cache = null;
    throw e;
  });
  return cache;
};
