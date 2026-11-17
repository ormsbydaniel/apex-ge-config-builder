import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

const keycloak = {
  authenticated: true,
  token: 'access-token',
  refreshToken: 'refresh-token',
  idToken: 'id-token',
  tokenParsed: { exp: 2_000_000_000, sub: 'user' },
};

const login = vi.fn(() => Promise.resolve());
const logout = vi.fn(() => Promise.resolve());
const openAccount = vi.fn();
const auth = { revision: 0, authenticated: true, getToken: vi.fn(() => Promise.resolve('access-token')) };

vi.mock('@/auth/AuthContext', () => ({ useAuth: () => auth }));
vi.mock('@/auth/keycloak', () => ({
  getKeycloak: () => keycloak,
  login: () => login(),
  logout: () => logout(),
  openAccount: (newTab: boolean) => openAccount(newTab),
}));

import { AUTH_BRIDGE_VERSION, useViewerAuthBridge } from '../useViewerAuthBridge';

describe('useViewerAuthBridge', () => {
  let iframe: HTMLIFrameElement;
  let post: ReturnType<typeof vi.fn>;

  const send = (data: unknown, { origin = window.location.origin, source }: { origin?: string; source?: unknown } = {}) =>
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data,
          origin,
          source: (source === undefined ? iframe.contentWindow : source) as MessageEventSource,
        }),
      );
    });

  beforeEach(() => {
    iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    post = vi.fn();
    (iframe.contentWindow as Window).postMessage = post as unknown as Window['postMessage'];
    renderHook(() => useViewerAuthBridge({ current: iframe }, true));
    post.mockClear();
  });

  afterEach(() => {
    iframe.remove();
    vi.clearAllMocks();
  });

  const request = { type: 'apex-auth-request-state', apexAuthBridge: AUTH_BRIDGE_VERSION, requestId: 'r1' };

  it('replies to its own iframe at its own origin with the access token only', () => {
    send(request);
    expect(post).toHaveBeenCalledTimes(1);
    const [payload, targetOrigin] = post.mock.calls[0];
    expect(targetOrigin).toBe(window.location.origin);
    expect(payload).toMatchObject({ type: 'apex-auth-state', requestId: 'r1', token: 'access-token' });
    const serialised = JSON.stringify(payload);
    expect(serialised).not.toContain('refresh-token');
    expect(serialised).not.toContain('id-token');
  });

  it('ignores messages from another origin', () => {
    send(request, { origin: 'https://evil.example' });
    expect(post).not.toHaveBeenCalled();
  });

  it('ignores same-origin messages from a window other than the iframe', () => {
    send(request, { source: window });
    send(request, { source: null });
    expect(post).not.toHaveBeenCalled();
  });

  it('ignores messages with a different bridge version', () => {
    send({ ...request, apexAuthBridge: AUTH_BRIDGE_VERSION + 1 });
    send({ type: 'apex-auth-request-state' });
    expect(post).not.toHaveBeenCalled();
  });

  it('does not redirect for login requests from a foreign origin', () => {
    send({ type: 'apex-auth-login', apexAuthBridge: AUTH_BRIDGE_VERSION }, { origin: 'https://evil.example' });
    expect(login).not.toHaveBeenCalled();
    send({ type: 'apex-auth-login', apexAuthBridge: AUTH_BRIDGE_VERSION });
    expect(login).toHaveBeenCalledTimes(1);
  });
});
