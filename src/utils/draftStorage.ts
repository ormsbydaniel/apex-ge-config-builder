import { storageKey } from '@/utils/browserStorage';
import type { LoadedConfigSource } from '@/contexts/ConfigContext';

/**
 * The working copy of the builder. New config fields are persisted here,
 * because the envelope stores the config content plus the flags below.
 * Leave transient fields out: loading flags, validation results, unsaved-form
 * markers, and `env` (tokens and signed URLs must never be written).
 */
export const DRAFT_SCHEMA_VERSION = 1;
export const DRAFT_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
export const PENDING_RESTORE_MAX_AGE_MS = 15 * 60 * 1000;

const DRAFT_NAME = 'draft';
const PENDING_NAME = 'pending-restore';
const TAB_NAME = 'tab-id';
export const DRAFT_CHANNEL = 'apex-ge-builder:draft';

export interface PersistedDraftState {
  isDirty: boolean;
  lastLoadedSource: LoadedConfigSource | null;
  lastExported: string | null;
  lastLoaded: string | null;
  [field: string]: unknown;
}

export interface DraftEnvelope {
  schemaVersion: number;
  savedAt: string;
  builderVersion: string;
  tabId: string;
  route: string;
  state: PersistedDraftState;
}

export interface PendingRestore {
  route: string;
  previewVersion: string | null;
  savedAt: string;
}

export type DraftReadResult =
  | { status: 'empty' }
  | { status: 'ok'; envelope: DraftEnvelope }
  | { status: 'too-old'; raw: string; savedAt: string; envelope: DraftEnvelope }
  | { status: 'corrupt'; raw: string };

export class DraftStorageError extends Error {
  constructor(message = 'Draft storage is unavailable') {
    super(message);
    this.name = 'DraftStorageError';
  }
}

export interface KeyValueStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

export function createMemoryStore(): KeyValueStore {
  const values = new Map<string, string>();
  return {
    async get(key) {
      return values.has(key) ? values.get(key)! : null;
    },
    async set(key, value) {
      values.set(key, value);
    },
    async delete(key) {
      values.delete(key);
    },
  };
}

const INTERNAL_STATE_FIELDS = new Set([
  'isLoading',
  'validationResults',
  'hasUnsavedFormChanges',
  'unsavedFormDescription',
  'env',
]);

/** One place that decides which config fields are written into a draft. */
export function pickDraftState(config: {
  isDirty: boolean;
  lastLoadedSource: LoadedConfigSource | null;
  lastExported: Date | null;
  lastLoaded: Date | null;
}): PersistedDraftState {
  const record = config as unknown as Record<string, unknown>;
  const state: PersistedDraftState = {
    isDirty: config.isDirty,
    lastLoadedSource: config.lastLoadedSource,
    lastExported: config.lastExported ? config.lastExported.toISOString() : null,
    lastLoaded: config.lastLoaded ? config.lastLoaded.toISOString() : null,
  };
  for (const [key, value] of Object.entries(record)) {
    if (INTERNAL_STATE_FIELDS.has(key)) continue;
    if (key === 'isDirty' || key === 'lastLoadedSource' || key === 'lastExported' || key === 'lastLoaded') {
      continue;
    }
    if (typeof value === 'function') continue;
    state[key] = value;
  }
  return state;
}

/**
 * The draft is the working copy. It stays after export and after loading a
 * file. It is removed only when the builder is back to a fresh config, or
 * when the user discards it.
 */
export function shouldKeepDraft(state: {
  isDirty: boolean;
  lastLoaded: Date | string | null;
  lastExported: Date | string | null;
}): boolean {
  return Boolean(state.isDirty || state.lastLoaded || state.lastExported);
}

export function buildDraftEnvelope(
  state: PersistedDraftState,
  route: string,
  tabId: string,
  now = new Date(),
): DraftEnvelope {
  return {
    schemaVersion: DRAFT_SCHEMA_VERSION,
    savedAt: now.toISOString(),
    builderVersion: import.meta.env.VITE_APP_VERSION || 'dev',
    tabId,
    route,
    state,
  };
}

/** Migrate older envelopes. Unknown future versions return null (corrupt). */
export function migrateEnvelope(raw: unknown): DraftEnvelope | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, any>;

  if (record.schemaVersion === DRAFT_SCHEMA_VERSION && record.state && typeof record.state === 'object') {
    return record as DraftEnvelope;
  }

  // schemaVersion 0 stored the config under `config` and the flags beside it.
  if (record.schemaVersion === 0 && record.config && typeof record.config === 'object') {
    return {
      schemaVersion: DRAFT_SCHEMA_VERSION,
      savedAt: typeof record.savedAt === 'string' ? record.savedAt : new Date(0).toISOString(),
      builderVersion: typeof record.builderVersion === 'string' ? record.builderVersion : '0',
      tabId: typeof record.tabId === 'string' ? record.tabId : 'migrated',
      route: typeof record.route === 'string' ? record.route : '/',
      state: {
        ...record.config,
        isDirty: record.isDirty !== false,
        lastLoadedSource: record.lastLoadedSource ?? null,
        lastExported: record.lastExported ?? null,
        lastLoaded: record.lastLoaded ?? null,
      },
    };
  }

  return null;
}

export function parseDraft(text: string | null, now = Date.now()): DraftReadResult {
  if (!text) return { status: 'empty' };
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { status: 'corrupt', raw: text };
  }
  const envelope = migrateEnvelope(parsed);
  if (!envelope) return { status: 'corrupt', raw: text };
  const savedAt = Date.parse(envelope.savedAt);
  if (!Number.isFinite(savedAt)) return { status: 'corrupt', raw: text };
  if (now - savedAt > DRAFT_MAX_AGE_MS) {
    return { status: 'too-old', raw: text, savedAt: envelope.savedAt, envelope };
  }
  return { status: 'ok', envelope };
}

function newerText(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  const aSaved = savedAtOf(a);
  const bSaved = savedAtOf(b);
  if (aSaved == null) return b;
  if (bSaved == null) return a;
  return aSaved >= bSaved ? a : b;
}

function savedAtOf(text: string): number | null {
  try {
    const parsed = JSON.parse(text) as { savedAt?: string };
    const time = Date.parse(parsed?.savedAt ?? '');
    return Number.isFinite(time) ? time : null;
  } catch {
    return null;
  }
}

const DB_NAME = 'apex-ge-builder';
const DB_STORE = 'kv';

function idbAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

let databasePromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        databasePromise = null;
        reject(request.error);
      };
    });
  }
  return databasePromise;
}

async function idbGet(key: string): Promise<string | null> {
  const db = await openDatabase();
  const tx = db.transaction(DB_STORE, 'readonly');
  const value = await requestToPromise(tx.objectStore(DB_STORE).get(key));
  return typeof value === 'string' ? value : null;
}

async function idbSet(key: string, value: string): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(DB_STORE, 'readwrite');
  await requestToPromise(tx.objectStore(DB_STORE).put(value, key));
}

async function idbDelete(key: string): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(DB_STORE, 'readwrite');
  await requestToPromise(tx.objectStore(DB_STORE).delete(key));
}

function localGet(name: string): string | null {
  try {
    return localStorage.getItem(storageKey(name));
  } catch {
    return null;
  }
}

function localSet(name: string, value: string): boolean {
  try {
    localStorage.setItem(storageKey(name), value);
    return true;
  } catch {
    return false;
  }
}

function localDelete(name: string): void {
  try {
    localStorage.removeItem(storageKey(name));
  } catch {
    // ignore
  }
}

export function getTabId(): string {
  try {
    const key = storageKey(TAB_NAME);
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const created = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `tab-${Date.now()}`;
    sessionStorage.setItem(key, created);
    return created;
  } catch {
    return 'tab';
  }
}

export async function readDraft(store?: KeyValueStore): Promise<DraftReadResult> {
  if (store) {
    const text = await store.get(DRAFT_NAME);
    return parseDraft(text);
  }
  let idbText: string | null = null;
  if (idbAvailable()) {
    try {
      idbText = await idbGet(DRAFT_NAME);
    } catch {
      idbText = null;
    }
  }
  const localText = localGet(DRAFT_NAME);
  return parseDraft(newerText(idbText, localText));
}

export interface SaveDraftResult {
  idb: boolean;
  local: boolean;
}

/** Synchronous localStorage mirror used on page hide, where IndexedDB may not finish. */
export function saveDraftLocalSync(envelope: DraftEnvelope): boolean {
  return localSet(DRAFT_NAME, JSON.stringify(envelope));
}

export async function saveDraft(envelope: DraftEnvelope, store?: KeyValueStore): Promise<SaveDraftResult> {
  const text = JSON.stringify(envelope);
  if (store) {
    await store.set(DRAFT_NAME, text);
    return { idb: true, local: false };
  }

  let idb = false;
  let local = false;
  if (idbAvailable()) {
    try {
      await idbSet(DRAFT_NAME, text);
      idb = true;
    } catch {
      idb = false;
    }
  }
  local = localSet(DRAFT_NAME, text);
  if (!idb && !local) throw new DraftStorageError();
  return { idb, local };
}

export async function deleteDraft(store?: KeyValueStore): Promise<void> {
  if (store) {
    await store.delete(DRAFT_NAME);
    return;
  }
  if (idbAvailable()) {
    try {
      await idbDelete(DRAFT_NAME);
    } catch {
      // The local copy is still removed below.
    }
  }
  localDelete(DRAFT_NAME);
}

export function readPendingRestore(now = Date.now()): PendingRestore | null {
  const text = localGet(PENDING_NAME);
  if (!text) return null;
  try {
    const parsed = JSON.parse(text) as PendingRestore;
    const savedAt = Date.parse(parsed?.savedAt ?? '');
    if (!parsed?.route || !Number.isFinite(savedAt)) {
      localDelete(PENDING_NAME);
      return null;
    }
    if (now - savedAt > PENDING_RESTORE_MAX_AGE_MS) {
      localDelete(PENDING_NAME);
      return null;
    }
    return parsed;
  } catch {
    localDelete(PENDING_NAME);
    return null;
  }
}

export function writePendingRestore(marker: PendingRestore): void {
  localSet(PENDING_NAME, JSON.stringify(marker));
}

export function clearPendingRestore(): void {
  localDelete(PENDING_NAME);
}

export function downloadDraft(raw: string, filename = 'config-builder-draft.json'): void {
  const blob = new Blob([raw], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
