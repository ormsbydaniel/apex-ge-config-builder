/**
 * Host-based "site has moved" gating.
 *
 * The Lovable-published custom domain (apex-ge-config-builder.sparkgeo.uk)
 * should display a "we've moved" splash pointing users at the new ESA-hosted
 * home. The downstream ESA mirrors (prod + dev) and local development skip
 * the splash and load the app normally.
 *
 * Phase 1: Lovable preview (*.lovable.app) also shows the splash so we can
 * visually QA it before publishing. Phase 2 will add *.lovable.app to
 * SKIP_HOSTS so only the sparkgeo domain ever renders the notice.
 *
 * A `?devview=1` query parameter bypasses the splash and persists the
 * bypass in sessionStorage so devs can navigate freely during a QA session.
 */

export const NEW_SITE_URL = "https://ge-config-builder.apex.esa.int/";
export const BYPASS_PARAM = "devview";
export const BYPASS_STORAGE_KEY = "apex.devview";

const SKIP_HOSTS = [
  "ge-config-builder.apex.esa.int",
  "ge-config-builder.dev.apex.esa.int",
  "localhost",
  "127.0.0.1",
];

function isSkippedHost(hostname: string): boolean {
  if (SKIP_HOSTS.includes(hostname)) return true;
  // Phase 2: Lovable preview / sandbox hosts also skip the splash.
  if (hostname.endsWith(".lovable.app")) return true;
  if (hostname.endsWith(".lovable.dev")) return true;
  return false;
}

export function shouldShowRelocationNotice(): boolean {
  if (typeof window === "undefined") return false;

  const hostname = window.location.hostname;
  if (isSkippedHost(hostname)) return false;

  // Query param bypass — persist for the session.
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get(BYPASS_PARAM) === "1") {
      window.sessionStorage.setItem(BYPASS_STORAGE_KEY, "1");
      return false;
    }
    if (window.sessionStorage.getItem(BYPASS_STORAGE_KEY) === "1") {
      return false;
    }
  } catch {
    // sessionStorage may be unavailable (privacy mode); fall through.
  }

  return true;
}
