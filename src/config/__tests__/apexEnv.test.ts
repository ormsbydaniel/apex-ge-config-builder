import { describe, expect, it } from 'vitest';
import { buildViewerEnv, defaultsForHostname, isSameSite, mergeApexEnv } from '@/config/apexEnv';
import { supportsHostAuth } from '@/utils/viewerVersions';

describe('apex environment', () => {
  it('uses the production realm on the hosted builder and dev elsewhere', () => {
    expect(defaultsForHostname('ge-config-builder.apex.esa.int').KEYCLOAK_URL).toBe('https://auth.apex.esa.int');
    expect(defaultsForHostname('ge-config-builder.dev.apex.esa.int').KEYCLOAK_URL).toBe('https://auth.dev.apex.esa.int');
    expect(defaultsForHostname('localhost').APEX_DISPATCHER_API_BASE_URL).toBe('dispatch-api.dev.apex.esa.int');
  });

  it('lets env.json override hostname defaults', () => {
    const merged = mergeApexEnv(defaultsForHostname('localhost'), {
      KEYCLOAK_CLIENT_ID: 'apex-explorer',
      APEX_API_BASE_URL: '/api',
      FEATURE_FLAGS: { KEYCLOAK_ACTIVE: false },
    });
    expect(merged.APEX_API_BASE_URL).toBe('/api');
    expect(merged.FEATURE_FLAGS.KEYCLOAK_ACTIVE).toBe(false);
    expect(merged.KEYCLOAK_REALM).toBe('apex');
  });

  it('treats ESA hosts as the same site and localhost as a different site from Keycloak', () => {
    expect(isSameSite('ge-config-builder.apex.esa.int', 'https://auth.dev.apex.esa.int')).toBe(true);
    expect(isSameSite('localhost', 'https://auth.dev.apex.esa.int')).toBe(false);
  });

  it('sends host auth only to bundles that understand it', () => {
    const env = defaultsForHostname('localhost');
    expect(supportsHostAuth('4.4.0')).toBe(true);
    expect(supportsHostAuth('4.2.1')).toBe(false);
    expect(supportsHostAuth('4.3.0-rc')).toBe(false);
    expect(supportsHostAuth('dev-auth')).toBe(true);
    expect(supportsHostAuth('dev-host-auth')).toBe(true);

    const modern = buildViewerEnv('4.4.0', true, env);
    expect(modern.AUTH_MODE).toBe('host');
    expect(modern.FEATURE_FLAGS.KEYCLOAK_ACTIVE).toBe(true);
    expect(modern.APEX_DISPATCHER_API_BASE_URL).not.toMatch(/^https?:/);

    const legacy = buildViewerEnv('3.5.0', false, env);
    expect(legacy.AUTH_MODE).toBeUndefined();
    expect(legacy.FEATURE_FLAGS.KEYCLOAK_ACTIVE).toBe(false);
  });
});
