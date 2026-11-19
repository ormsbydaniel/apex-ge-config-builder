import Keycloak from 'keycloak-js';
import { getApexEnv, isSameSite, loadApexEnv } from '@/config/apexEnv';
import { currentAppPath, withBase } from '@/utils/appPaths';
import { flushDraftNow } from '@/utils/draftFlush';
import { writePendingRestore } from '@/utils/draftStorage';
import { getSavedViewerVersion } from '@/utils/viewerVersions';

let instance: Keycloak | null = null;
let initPromise: Promise<Keycloak | null> | null = null;

export function getKeycloak(): Keycloak | null {
  return instance;
}

/**
 * The one registered sign-in and sign-out redirect. Keycloak matches it
 * exactly (`/callback`), the same way the Geospatial Explorer does.
 * The route to return to is stored separately and restored after this page loads.
 */
export function callbackRedirectUri(): string {
  return `${window.location.origin}${withBase('callback')}`;
}

export function silentCheckUri(): string {
  return `${window.location.origin}${withBase('silent-check-sso.html')}`;
}

async function rememberSession(): Promise<void> {
  await flushDraftNow();
  writePendingRestore({
    route: currentAppPath(),
    previewVersion: getSavedViewerVersion(),
    savedAt: new Date().toISOString(),
  });
}

export async function initKeycloak(): Promise<Keycloak | null> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const env = await loadApexEnv();
    if (!env.KEYCLOAK_URL || !env.KEYCLOAK_REALM || !env.KEYCLOAK_CLIENT_ID) return null;
    const keycloak = new Keycloak({
      url: env.KEYCLOAK_URL,
      realm: env.KEYCLOAK_REALM,
      clientId: env.KEYCLOAK_CLIENT_ID,
    });
    // Available for login() even if the silent check never returns (for example
    // when this origin is not yet registered as a redirect URI).
    instance = keycloak;
    const initAttempt = keycloak.init({
      onLoad: 'check-sso',
      pkceMethod: 'S256',
      redirectUri: callbackRedirectUri(),
      silentCheckSsoRedirectUri: silentCheckUri(),
      // A failed silent check must not redirect the whole builder to Keycloak.
      silentCheckSsoFallback: false,
      // The session-status iframe only works when Keycloak shares the page's site.
      checkLoginIframe: isSameSite(window.location.hostname, env.KEYCLOAK_URL),
      messageReceiveTimeout: 5000,
    }).then(() => true).catch((error) => {
      console.error('Failed to initialize authentication', error);
      return false;
    });

    const outcome = await Promise.race([
      initAttempt,
      new Promise<'timeout'>((resolve) => {
        window.setTimeout(() => resolve('timeout'), 8000);
      }),
    ]);
    if (outcome === 'timeout') {
      console.warn('Keycloak silent sign-in did not finish; continuing signed out');
    }
    return keycloak;
  })();
  return initPromise;
}

export async function login(): Promise<void> {
  const keycloak = getKeycloak() ?? await initKeycloak();
  if (!keycloak) throw new Error('Sign-in is unavailable');
  await rememberSession();
  await keycloak.login({ redirectUri: callbackRedirectUri() });
}

export async function logout(): Promise<void> {
  const keycloak = getKeycloak();
  if (!keycloak?.authenticated) return;
  await rememberSession();
  await keycloak.logout({ redirectUri: callbackRedirectUri() });
}

/** Account console. `newTab` keeps the preview iframe from navigating away. */
export async function openAccount(newTab = false): Promise<void> {
  const keycloak = getKeycloak();
  if (!keycloak?.authenticated) return;
  const url = keycloak.createAccountUrl();
  if (newTab) {
    window.open(url, '_blank', 'noopener');
    return;
  }
  await rememberSession();
  window.location.assign(url);
}

export function keycloakConfigured(): boolean {
  const env = getApexEnv();
  return Boolean(env.KEYCLOAK_URL && env.KEYCLOAK_REALM && env.KEYCLOAK_CLIENT_ID);
}
