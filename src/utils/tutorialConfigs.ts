/**
 * Lists tutorial configurations from the `tutorials` folder of the
 * ESA-APEx/apex_geospatial_explorer_configs repository. Files follow the
 * pattern `tutorial-N-completion[_YYYYMMDD_HHmm].json` /
 * `tutorial-N-prerequisite[_YYYYMMDD_HHmm].json`.
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
  updatedAt?: string;
}

const PATTERN = /^tutorial-(\d+)-(completion|prerequisite)(?:_(\d{8})_(\d{4}))?\.json$/i;

interface ParsedTutorialFile {
  tutorial: number;
  kind: TutorialKind;
  timestamp?: string;
  updatedAt?: string;
}

function parseTutorialFileName(name: string): ParsedTutorialFile | null {
  const match = PATTERN.exec(name);
  if (!match) return null;

  const tutorial = Number.parseInt(match[1], 10);
  const kind = match[2].toLowerCase() as TutorialKind;
  if (!match[3] || !match[4]) return { tutorial, kind };

  const timestamp = `${match[3]}${match[4]}`;
  const year = Number.parseInt(match[3].slice(0, 4), 10);
  const month = Number.parseInt(match[3].slice(4, 6), 10);
  const day = Number.parseInt(match[3].slice(6, 8), 10);
  const hour = Number.parseInt(match[4].slice(0, 2), 10);
  const minute = Number.parseInt(match[4].slice(2, 4), 10);
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute));
  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
    || date.getUTCHours() !== hour
    || date.getUTCMinutes() !== minute
  ) return null;

  return { tutorial, kind, timestamp, updatedAt: date.toISOString() };
}

function formatUpdatedAt(updatedAt: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'UTC',
    timeZoneName: 'short',
  }).format(new Date(updatedAt));
}

/** Parse, de-duplicate and sort tutorial configs; non-matching files are ignored. */
export function parseTutorialListing(
  entries: Array<{ name?: unknown; type?: unknown; download_url?: unknown }>,
): TutorialConfigEntry[] {
  const latest = new Map<string, { entry: TutorialConfigEntry; timestamp?: string }>();
  for (const e of entries) {
    if (typeof e?.name !== 'string' || (e.type !== undefined && e.type !== 'file')) continue;
    const parsed = parseTutorialFileName(e.name);
    if (!parsed) continue;
    const { tutorial, kind, timestamp, updatedAt } = parsed;
    const url = typeof e.download_url === 'string' && e.download_url
      ? e.download_url
      : `https://raw.githubusercontent.com/${TUTORIALS_REPO}/${TUTORIALS_BRANCH}/${TUTORIALS_DIR}/${e.name}`;
    const baseDescription = kind === 'prerequisite'
      ? `Starting point for Tutorial ${tutorial}`
      : `Finished result of Tutorial ${tutorial}`;
    const entry: TutorialConfigEntry = {
      id: `tutorial-${tutorial}-${kind}`,
      tutorial,
      kind,
      name: `Tutorial ${tutorial} ${kind}`,
      description: updatedAt
        ? `${baseDescription} · Last updated ${formatUpdatedAt(updatedAt)}`
        : baseDescription,
      url,
      fileName: e.name,
      ...(updatedAt && { updatedAt }),
    };
    const key = `${tutorial}-${kind}`;
    const current = latest.get(key);
    if (!current || (timestamp !== undefined && (current.timestamp === undefined || timestamp > current.timestamp))) {
      latest.set(key, { entry, timestamp });
    }
  }
  return Array.from(latest.values(), ({ entry }) => entry).sort((a, b) =>
    a.tutorial - b.tutorial || (a.kind === b.kind ? 0 : a.kind === 'prerequisite' ? -1 : 1));
}

/**
 * Session memory: latest entry per tutorial/kind, and downloaded file text by
 * exact file name. The folder listing (names only) is re-read on every call;
 * file contents are only downloaded again when a fresher date stamp appears.
 */
const entriesByKey = new Map<string, TutorialConfigEntry>();
const textByFileName = new Map<string, string>();

const keyOf = (e: Pick<TutorialConfigEntry, 'tutorial' | 'kind'>) => `${e.tutorial}-${e.kind}`;

export function __resetTutorialCache(): void {
  entriesByKey.clear();
  textByFileName.clear();
}

/** Merge a fresh listing, keeping unchanged entry objects and evicting stale file text. */
function mergeListing(fresh: TutorialConfigEntry[]): TutorialConfigEntry[] {
  const seen = new Set<string>();
  const merged = fresh.map((entry) => {
    const key = keyOf(entry);
    seen.add(key);
    const current = entriesByKey.get(key);
    if (current && current.fileName === entry.fileName) return current;
    if (current?.fileName) textByFileName.delete(current.fileName);
    entriesByKey.set(key, entry);
    return entry;
  });
  for (const [key, entry] of entriesByKey) {
    if (!seen.has(key)) {
      if (entry.fileName) textByFileName.delete(entry.fileName);
      entriesByKey.delete(key);
    }
  }
  return merged;
}

export const fetchTutorialConfigs = async (): Promise<TutorialConfigEntry[]> => {
  const res = await fetch(TUTORIALS_LISTING_URL, {
    headers: { Accept: 'application/vnd.github+json' },
    cache: 'no-store',
  });
  if (res.status === 403 || res.status === 429) {
    throw new Error('GitHub rate limit reached — please try again in a few minutes.');
  }
  if (!res.ok) throw new Error(`Failed to list tutorial configurations (HTTP ${res.status})`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error('Unexpected response listing the tutorials folder');
  return mergeListing(parseTutorialListing(data));
};

/** Return the tutorial JSON text, downloading it only once per file name. */
export async function getTutorialConfigText(entry: TutorialConfigEntry): Promise<string> {
  const name = entry.fileName || entry.url;
  const cached = textByFileName.get(name);
  if (cached !== undefined) return cached;
  const res = await fetch(entry.url);
  if (!res.ok) throw new Error(`Failed to download ${entry.fileName || 'tutorial'} (HTTP ${res.status})`);
  const text = await res.text();
  textByFileName.set(name, text);
  return text;
}
