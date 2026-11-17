import { useEffect, useRef } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { getKeycloak, login, logout, openAccount } from '@/auth/keycloak';

export const AUTH_BRIDGE_VERSION = 1;

type BridgeMessage = {
  type?: string;
  requestId?: string;
  minValidity?: number;
  apexAuthBridge?: number;
};

function authStatePayload(requestId?: string) {
  const keycloak = getKeycloak();
  const authenticated = Boolean(keycloak?.authenticated && keycloak.token);
  const exp = keycloak?.tokenParsed?.exp;
  return {
    type: 'apex-auth-state',
    apexAuthBridge: AUTH_BRIDGE_VERSION,
    requestId,
    authenticated,
    token: authenticated ? keycloak?.token ?? null : null,
    tokenParsed: authenticated ? keycloak?.tokenParsed ?? null : null,
    expiresAt: authenticated && typeof exp === 'number' ? exp * 1000 : null,
  };
}

/**
 * The builder owns the Keycloak session. The embedded explorer asks for it
 * over postMessage and never starts its own login inside the iframe.
 */
export function useViewerAuthBridge(iframeRef: React.RefObject<HTMLIFrameElement | null>, enabled: boolean) {
  const auth = useAuth();
  const iframeRefStable = useRef(iframeRef);
  iframeRefStable.current = iframeRef;

  const postState = (requestId?: string) => {
    const iframeWindow = iframeRefStable.current.current?.contentWindow;
    if (!iframeWindow) return;
    iframeWindow.postMessage(authStatePayload(requestId), window.location.origin);
  };

  useEffect(() => {
    if (!enabled) return;
    postState();
    // Push whenever the session or token changes, including after a refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, auth.revision, auth.authenticated]);

  useEffect(() => {
    if (!enabled) return;

    const onMessage = (event: MessageEvent<BridgeMessage>) => {
      if (event.origin !== window.location.origin) return;
      const iframeWindow = iframeRefStable.current.current?.contentWindow;
      if (!iframeWindow || event.source !== iframeWindow) return;
      const data = event.data;
      if (!data || data.apexAuthBridge !== AUTH_BRIDGE_VERSION) return;

      if (data.type === 'apex-auth-request-state') {
        postState(data.requestId);
        return;
      }

      if (data.type === 'apex-auth-refresh') {
        const minValidity = typeof data.minValidity === 'number' ? data.minValidity : 30;
        auth.getToken(minValidity)
          .then(() => postState(data.requestId))
          .catch(() => postState(data.requestId));
        return;
      }

      if (data.type === 'apex-auth-login') {
        void login().catch((error) => console.error(error));
        return;
      }

      if (data.type === 'apex-auth-logout') {
        void logout().catch((error) => console.error(error));
        return;
      }

      if (data.type === 'apex-auth-account') {
        void openAccount(true);
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [enabled, auth]);
}
