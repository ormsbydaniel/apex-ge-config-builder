## Goal

Make the viewer receive a fixed `env` object (Keycloak / dispatcher / feature flags / version) merged into the config it consumes. The env values are not user-editable, not part of import/export, and not stored in the schema — they are constants in the builder source.

## Approach

1. **New file `src/config/viewerEnv.ts`** — single source of truth for the env constants:
   ```ts
   export const VIEWER_ENV = {
     KEYCLOAK_URL: 'https://auth.dev.apex.esa.int',
     KEYCLOAK_CLIENT_ID: 'apex-explorer',
     KEYCLOAK_REALM: 'apex',
     APEX_DISPATCHER_API_BASE_URL: 'dispatch-api.dev.apex.esa.int',
     FEATURE_FLAGS: { KEYCLOAK_ACTIVE: true },
     VERSION: '3.0.0',
   } as const;
   ```

2. **`src/hooks/useViewerLoader.ts`** — wrap the delivered config so `env` rides along but never mutates the original config object:
   - Add a helper `withEnv(config)` that returns `{ ...config, env: VIEWER_ENV }`.
   - Use it in all three delivery paths:
     - `apex-viewer-config-delivery` postMessage payload (modern host handshake)
     - `setExplorerConfig` (modern, sets `iframe.contentWindow.explorerConfig`)
     - `invalidateViewerConfig` (live updates after ready)
     - `sendConfigLegacy` `apex-viewer-config` postMessage (legacy bundles)
   - Source config in `configRef` stays untouched so export/import is unaffected.

3. **Out of scope (intentionally)**
   - No schema, type, validation, or export changes.
   - No UI for editing env.
   - No changes to `public/viewer/viewer-host.html` — it already forwards whatever the parent delivers into `window.explorerConfig`, and the viewer bundle will read `config.env`.

## Technical notes

- `env` is attached as a sibling of existing top-level fields (`sources`, `layout`, `meta`, `workflows`, …). Since it is only added at delivery time, it cannot leak into the round-trip JSON or be stripped by sanitisation.
- Keep the constants in a dedicated file (not inline in the hook) so a future "dev vs prod" swap is a one-file change.
- No new dependencies, no test changes required (existing round-trip tests continue to assert env is absent from exported configs).
