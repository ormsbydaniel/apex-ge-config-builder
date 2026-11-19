import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type Keycloak from 'keycloak-js';
import { ApexEnv, getApexEnv, loadApexEnv } from '@/config/apexEnv';
import { hasRealmRole, TokenWithRealmRoles } from '@/auth/roles';
import { getKeycloak, initKeycloak, login as keycloakLogin, logout as keycloakLogout, openAccount } from '@/auth/keycloak';
import { setupProactiveRefresh } from '@/auth/refresh';

export interface AuthUser {
  name: string;
  username?: string;
  email?: string;
}

interface AuthContextValue {
  ready: boolean;
  authenticated: boolean;
  user: AuthUser | null;
  tokenParsed: TokenWithRealmRoles | null;
  env: ApexEnv;
  getToken: (minValidity?: number) => Promise<string>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  accountManagement: () => Promise<void>;
  hasRealmRole: (role: string) => boolean;
  /** Bumps when the token is refreshed so the preview bridge can push a new state. */
  revision: number;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function userFromToken(tokenParsed: Keycloak['tokenParsed']): AuthUser | null {
  if (!tokenParsed) return null;
  const parsed = tokenParsed as TokenWithRealmRoles & {
    preferred_username?: string;
    name?: string;
    given_name?: string;
    email?: string;
  };
  const name = parsed.preferred_username || parsed.name || parsed.given_name || parsed.email || 'Account';
  return { name, username: parsed.preferred_username, email: parsed.email };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tokenParsed, setTokenParsed] = useState<TokenWithRealmRoles | null>(null);
  const [env, setEnv] = useState<ApexEnv>(getApexEnv());
  const [revision, setRevision] = useState(0);

  const publish = useCallback((keycloak: Keycloak | null) => {
    const signedIn = Boolean(keycloak?.authenticated);
    setAuthenticated(signedIn);
    setUser(signedIn ? userFromToken(keycloak?.tokenParsed) : null);
    setTokenParsed(signedIn ? (keycloak?.tokenParsed as TokenWithRealmRoles) ?? null : null);
    setRevision((value) => value + 1);
  }, []);

  useEffect(() => {
    let refresh: ReturnType<typeof setupProactiveRefresh> | null = null;
    let cancelled = false;

    (async () => {
      const loaded = await loadApexEnv();
      if (cancelled) return;
      setEnv(loaded);
      const keycloak = await initKeycloak();
      if (cancelled) return;
      publish(keycloak);
      if (keycloak) {
        refresh = setupProactiveRefresh(keycloak);
        if (keycloak.authenticated) refresh.start();
        keycloak.onAuthSuccess = () => {
          publish(keycloak);
          refresh?.start();
        };
        keycloak.onAuthLogout = () => {
          publish(keycloak);
          refresh?.stop();
        };
        keycloak.onAuthRefreshSuccess = () => publish(keycloak);
        keycloak.onAuthRefreshError = () => publish(keycloak);
      }
      setReady(true);
    })().catch((error) => {
      console.error('Authentication setup failed', error);
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
      refresh?.cleanup();
    };
  }, [publish]);

  const getToken = useCallback(async (minValidity = 30) => {
    const keycloak = getKeycloak();
    if (!keycloak?.authenticated) throw new Error('Not authenticated');
    await keycloak.updateToken(minValidity);
    publish(keycloak);
    if (!keycloak.token) throw new Error('Not authenticated');
    return keycloak.token;
  }, [publish]);

  const value = useMemo<AuthContextValue>(() => ({
    ready,
    authenticated,
    user,
    tokenParsed,
    env,
    getToken,
    login: keycloakLogin,
    logout: keycloakLogout,
    accountManagement: () => openAccount(false),
    hasRealmRole: (role: string) => hasRealmRole(tokenParsed, role),
    revision,
  }), [ready, authenticated, user, tokenParsed, env, getToken, revision]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
