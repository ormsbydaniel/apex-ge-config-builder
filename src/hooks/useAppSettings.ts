import { useSyncExternalStore, useCallback } from 'react';

/**
 * App-level (browser-local) preferences for the Configuration Builder.
 *
 * These are intentionally separate from the exported JSON config — they
 * affect builder behaviour only and are persisted in localStorage for the
 * current browser. Add new keys here with safe defaults.
 */
export interface AppSettings {
  showDevViewerVersions: boolean;
}

const STORAGE_KEY = 'apex-config-builder-app-settings';

const DEFAULTS: AppSettings = {
  showDevViewerVersions: false,
};

function read(): AppSettings {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...(parsed && typeof parsed === 'object' ? parsed : {}) };
  } catch {
    return DEFAULTS;
  }
}

let cached: AppSettings = read();
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): AppSettings {
  return cached;
}

function write(next: AppSettings) {
  cached = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore quota / privacy-mode errors
  }
  emit();
}

// Keep cross-tab updates in sync.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      cached = read();
      emit();
    }
  });
}

export function useAppSettings() {
  const settings = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const setSetting = useCallback(
    <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      write({ ...cached, [key]: value });
    },
    []
  );

  const resetSettings = useCallback(() => {
    write({ ...DEFAULTS });
  }, []);

  return { settings, setSetting, resetSettings };
}
