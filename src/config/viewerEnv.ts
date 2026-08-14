/**
 * Hardcoded environment object delivered to the viewer iframe alongside the
 * user-authored config. Not part of the config schema, not editable in the UI,
 * and never included in import/export round-trips.
 *
 * Swap these values to retarget the builder at a different APEX environment.
 */
export const VIEWER_ENV = {
  KEYCLOAK_URL: 'https://auth.dev.apex.esa.int',
  KEYCLOAK_CLIENT_ID: 'apex-explorer',
  KEYCLOAK_REALM: 'apex',
  APEX_DISPATCHER_API_BASE_URL: 'dispatch-api.dev.apex.esa.int',
  FEATURE_FLAGS: { KEYCLOAK_ACTIVE: true },
} as const;

/**
 * Build the env delivered to the viewer, stamping in the viewer bundle
 * version currently selected in the preview bundle dropdown.
 */
export const buildViewerEnv = (version: string) => ({
  ...VIEWER_ENV,
  VERSION: version,
});
