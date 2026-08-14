# Use the selected bundle version in the preview env

The preview iframe currently receives a hardcoded `VERSION: "3.0.0"` in the env object. It should instead report the viewer bundle version chosen in the preview's bundle dropdown.

## What changes

- The env passed to the viewer keeps all its existing values (Keycloak settings, dispatcher URL, feature flags) but `VERSION` becomes dynamic, set to the currently selected viewer bundle version (e.g. `3.6.0`, or a dev/candidate bundle name).
- Switching bundles in the dropdown reloads the preview with the matching version string.

## Technical detail

- `src/config/viewerEnv.ts`: drop the hardcoded `VERSION` from `VIEWER_ENV` (keep it as the base env) and export a small helper, e.g. `buildViewerEnv(version: string)`, returning `{ ...VIEWER_ENV, VERSION: version }`.
- `src/hooks/useViewerLoader.ts`: the hook already receives the selected `version` prop; change `withEnv(config)` to use `buildViewerEnv(version)` and make sure the memoisation/config delivery depends on `version` so a bundle switch re-sends the env.
- No config schema or import/export changes — env stays outside the user config.
