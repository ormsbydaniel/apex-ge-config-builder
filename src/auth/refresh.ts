import type Keycloak from 'keycloak-js';

const REFRESH_INTERVAL_MS = 30000;
const REFRESH_MIN_VALIDITY = 70;
const TOKEN_EXPIRED_MIN_VALIDITY = 30;

/**
 * Keeps the access token fresh. Mirrors the explorer's proactive refresh so a
 * session handed to the preview does not expire while the builder is open.
 */
export function setupProactiveRefresh(instance: Keycloak) {
  let refreshInFlight: Promise<boolean> | null = null;
  let refreshTimer: ReturnType<typeof setInterval> | null = null;

  const refreshToken = (minValidity: number) => {
    if (!instance.authenticated) return Promise.resolve(false);
    if (refreshInFlight) return refreshInFlight;

    refreshInFlight = instance
      .updateToken(minValidity)
      .catch((error) => {
        if (instance.authenticated) {
          console.error('Failed to refresh token, logging out');
          void instance.logout();
        }
        throw error;
      })
      .finally(() => {
        refreshInFlight = null;
      });

    return refreshInFlight;
  };

  instance.onTokenExpired = () => {
    if (!instance.authenticated) return;
    void refreshToken(TOKEN_EXPIRED_MIN_VALIDITY).catch(() => {});
  };

  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible' && instance.authenticated) {
      void refreshToken(REFRESH_MIN_VALIDITY).catch(() => {});
    }
  };

  document.addEventListener('visibilitychange', onVisibilityChange);

  return {
    start() {
      if (refreshTimer || !instance.authenticated) return;
      refreshTimer = setInterval(() => {
        void refreshToken(REFRESH_MIN_VALIDITY).catch(() => {});
      }, REFRESH_INTERVAL_MS);
    },
    stop() {
      if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
      }
    },
    cleanup() {
      this.stop();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    },
  };
}
