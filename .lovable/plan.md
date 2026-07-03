## Problem

`src/pages/Preview.tsx` builds `viewerConfig` by picking specific fields from `config` (version, layout, interfaceGroups, exclusivitySets, services, sources, mapConstraints, projections). `stories` is not in that list, so it never reaches the iframe viewer.

## Fix

In `src/pages/Preview.tsx`:

1. Add `stories: config.stories` to the `viewerConfig` object built inside `useMemo`.
2. Add `config.stories` to the `useMemo` dependency array.

That's the only change needed — the schema, ConfigContext, and iframe delivery already carry any fields present on `viewerConfig`.

## Verification

- Load a config with `stories` in the JSON editor, apply, open Preview, click the "Inspect delivered config" (FileJson) button in the Preview header, and confirm `stories` appears in the delivered JSON.
