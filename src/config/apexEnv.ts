/**
 * One APEx environment for builder sign-in and the previewed explorer.
 * Resolved from a runtime `env.json` (written by a project pod) and otherwise
 * from the hostname, so the two cannot drift.
 *
 * `APEX_DISPATCHER_API_BASE_URL` stays a host only. The explorer adds `https://`.
 * `AUTH_MODE` is added only when the env is delivered to a viewer that understands
 * host-owned authentication. It is not part of the builder's own settings.
 */

export interface ApexFeatureFlags {
  KEYCLOAK_ACTIVE: boolean;
  [flag: string]: boolean;
}

export interface ApexEnv {
  KEYCLOAK_URL: string;
  KEYCLOAK_REALM: string;
  KEYCLOAK_CLIENT_ID: string;
  APEX_DISPATCHER_API_BASE_URL: string;
  APEX_API_BASE_URL: string;
  FEATURE_FLAGS: ApexFeatureFlags;
}

const DEV_DEFAULTS: ApexEnv = {
  KEYCLOAK_URL: 'https://auth.dev.apex.esa.int',
  KEYCLOAK_REALM: 'apex',
  KEYCLOAK_CLIENT_ID: 'apex-explorer',
  APEX_DISPATCHER_API_BASE_URL: 'dispatch-api.dev.apex.esa.int',
  APEX_API_BASE_URL: '',
  FEATURE_FLAGS: { KEYCLOAK_ACTIVE: true },
};

const PROD_DEFAULTS: ApexEnv = {
  KEYCLOAK_URL: 'https://auth.apex.esa.int',
  KEYCLOAK_REALM: 'apex',
  KEYCLOAK_CLIENT_ID: 'apex-explorer',
  APEX_DISPATCHER_API_BASE_URL: 'dispatch-api.apex.esa.int',
  APEX_API_BASE_URL: '',
  FEATURE_FLAGS: { KEYCLOAK_ACTIVE: true },
};

export function defaultsForHostname(hostname: string): ApexEnv {
  if (hostname === 'ge-config-builder.apex.esa.int') {
    return { ...PROD_DEFAULTS, FEATURE_FLAGS: { ...PROD_DEFAULTS.FEATURE_FLAGS } };
  }
  return { ...DEV_DEFAULTS, FEATURE_FLAGS: { ...DEV_DEFAULTS.FEATURE_FLAGS } };
}

function asFlags(value: unknown, fallback: ApexFeatureFlags): ApexFeatureFlags {
  if (!value || typeof value !== 'object') return fallback;
  const flags: ApexFeatureFlags = { ...fallback };
  for (const [key, flag] of Object.entries(value as Record<string, unknown>)) {
    if (typeof flag === 'boolean') flags[key] = flag;
  }
  return flags;
}

export function mergeApexEnv(defaults: ApexEnv, override: unknown): ApexEnv {
  if (!override || typeof override !== 'object') return defaults;
  const raw = override as Partial<ApexEnv>;
  return {
    KEYCLOAK_URL: typeof raw.KEYCLOAK_URL === 'string' ? raw.KEYCLOAK_URL : defaults.KEYCLOAK_URL,
    KEYCLOAK_REALM: typeof raw.KEYCLOAK_REALM === 'string' ? raw.KEYCLOAK_REALM : defaults.KEYCLOAK_REALM,
    KEYCLOAK_CLIENT_ID: typeof raw.KEYCLOAK_CLIENT_ID === 'string' ? raw.KEYCLOAK_CLIENT_ID : defaults.KEYCLOAK_CLIENT_ID,
    APEX_DISPATCHER_API_BASE_URL:
      typeof raw.APEX_DISPATCHER_API_BASE_URL === 'string'
        ? raw.APEX_DISPATCHER_API_BASE_URL
        : defaults.APEX_DISPATCHER_API_BASE_URL,
    APEX_API_BASE_URL: typeof raw.APEX_API_BASE_URL === 'string' ? raw.APEX_API_BASE_URL : defaults.APEX_API_BASE_URL,
    FEATURE_FLAGS: asFlags(raw.FEATURE_FLAGS, defaults.FEATURE_FLAGS),
  };
}

/** Registrable site of a hostname (`auth.dev.apex.esa.int` → `esa.int`). */
export function siteOf(hostname: string): string {
  const parts = hostname.split('.').filter(Boolean);
  if (parts.length <= 2) return hostname;
  return parts.slice(-2).join('.');
}

/** True when the page and Keycloak can share cookies (same site). */
export function isSameSite(pageHostname: string, keycloakUrl: string): boolean {
  try {
    const keycloakHost = new URL(keycloakUrl).hostname;
    if (pageHostname === 'localhost' || pageHostname === '127.0.0.1' || keycloakHost === 'localhost') {
      return pageHostname === keycloakHost;
    }
    return siteOf(pageHostname) === siteOf(keycloakHost);
  } catch {
    return false;
  }
}

let resolved: ApexEnv = defaultsForHostname(
  typeof window !== 'undefined' ? window.location.hostname : 'localhost',
);
let loading: Promise<ApexEnv> | null = null;

export function getApexEnv(): ApexEnv {
  return resolved;
}

export async function loadApexEnv(): Promise<ApexEnv> {
  if (!loading) {
    loading = (async () => {
      const defaults = defaultsForHostname(
        typeof window !== 'undefined' ? window.location.hostname : 'localhost',
      );
      if (typeof window === 'undefined') {
        resolved = defaults;
        return resolved;
      }
      try {
        const response = await fetch(`${import.meta.env.BASE_URL || '/'}env.json`, { cache: 'no-store' });
        const contentType = response.headers.get('content-type') ?? '';
        if (!response.ok || !contentType.includes('json')) {
          resolved = defaults;
          return resolved;
        }
        resolved = mergeApexEnv(defaults, await response.json());
        return resolved;
      } catch {
        resolved = defaults;
        return resolved;
      }
    })();
  }
  return loading;
}

export interface ViewerEnv extends ApexEnv {
  VERSION: string;
  AUTH_MODE?: 'host';
}

/**
 * Env delivered to the explorer iframe. Host auth is included only when the
 * selected bundle understands it; older bundles get Keycloak turned off so
 * they don't show a login button that cannot complete inside the frame.
 */
export function buildViewerEnv(version: string, hostAuth: boolean, env: ApexEnv = getApexEnv()): ViewerEnv {
  const flags = { ...env.FEATURE_FLAGS };
  if (!hostAuth) flags.KEYCLOAK_ACTIVE = false;
  return {
    ...env,
    FEATURE_FLAGS: flags,
    VERSION: version,
    ...(hostAuth ? { AUTH_MODE: 'host' as const } : {}),
  };
}
