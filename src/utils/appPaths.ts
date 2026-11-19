/** Vite `base`, always with a trailing slash (`/` or `/builder/`). */
export function appBase(): string {
  const base = import.meta.env.BASE_URL || '/';
  if (!base.endsWith('/')) return `${base}/`;
  return base;
}

/** React Router basename. Undefined at the site root. */
export function routerBasename(): string | undefined {
  const base = appBase();
  if (base === '/') return undefined;
  return base.replace(/\/$/, '');
}

/** Path under the builder base, for assets and in-app links. */
export function withBase(path: string): string {
  const suffix = path.replace(/^\//, '');
  if (!suffix) return appBase();
  return `${appBase()}${suffix}`;
}

/**
 * Current in-app path (no base prefix), including search and hash.
 * Safe to pass to `navigate()` when a basename is set.
 */
export function currentAppPath(): string {
  if (typeof window === 'undefined') return '/';
  const base = routerBasename() ?? '';
  let path = window.location.pathname || '/';
  if (base && (path === base || path.startsWith(`${base}/`))) {
    path = path.slice(base.length) || '/';
  }
  if (!path.startsWith('/')) path = `/${path}`;
  return path + window.location.search + window.location.hash;
}
