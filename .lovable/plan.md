# Pass settings through to the viewer preview

## Problem

The preview builds a trimmed copy of the configuration before handing it to the viewer. That copy lists only version, layout, interface groups, exclusivity sets, services, sources, map constraints, projections and stories. The new top-level `settings` block (for example `layerFetchTimeoutMs`) is not included, so the delivered config shown in the "Inspect delivered config" dialog has no settings and the viewer falls back to its own defaults.

## Change

In `src/pages/Preview.tsx`, include `settings: config.settings` in the memoised `viewerConfig` object and add `config.settings` to the memo dependency list.

## Result

The settings block appears in the delivered config JSON and updates live when the timeout is changed in the Settings tab, so the viewer honours it.
