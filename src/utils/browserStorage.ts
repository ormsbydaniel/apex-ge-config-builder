/**
 * Every builder key is prefixed so a project deployment can share an origin
 * with the Geospatial Explorer without colliding (for example `apex_intended_route`).
 */
export const STORAGE_PREFIX = 'apex-ge-builder:';

export function storageKey(name: string): string {
  return name.startsWith(STORAGE_PREFIX) ? name : `${STORAGE_PREFIX}${name}`;
}

export function readStored(storage: Storage, name: string): string | null {
  const key = storageKey(name);
  try {
    const current = storage.getItem(key);
    if (current !== null) return current;
    if (key === name) return null;
    const legacy = storage.getItem(name);
    if (legacy !== null) {
      try {
        storage.setItem(key, legacy);
      } catch {
        // Quota or privacy mode: still return the legacy value.
      }
      return legacy;
    }
  } catch {
    return null;
  }
  return null;
}

export function writeStored(storage: Storage, name: string, value: string): void {
  storage.setItem(storageKey(name), value);
}

export function removeStored(storage: Storage, name: string): void {
  try {
    storage.removeItem(storageKey(name));
  } catch {
    // Storage may be unavailable.
  }
}
