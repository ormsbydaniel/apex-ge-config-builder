# Inspect Config Delivered to Viewer Iframe

Add a way to inspect the exact config (including the merged `env` object) that gets delivered to the viewer iframe, accessible from the preview header bar next to the version selector.

## Changes

### 1. `src/hooks/useViewerLoader.ts`
- Export a stable reference to the "delivered config" (config merged with `VIEWER_ENV` via `withEnv`). Add `deliveredConfig` to the hook's return value, computed via `useMemo` from the incoming `config` so consumers always see exactly what is sent to the iframe.
- Add a one-line `console.log('[Config Builder] Delivered config:', deliveredConfig)` whenever the delivered config changes (gated on `isReady` to avoid noise during initial mount).

### 2. `src/pages/Preview.tsx`
- Read `deliveredConfig` from `useViewerLoader`.
- Add a small icon button (Lucide `Code2` or `FileJson`) in the header bar, placed between the version `Select` and the status badges, with a tooltip "Inspect delivered config".
- Clicking it opens a `Dialog` (shadcn) showing:
  - Title: "Config delivered to viewer"
  - A scrollable `<pre>` block with `JSON.stringify(deliveredConfig, null, 2)`
  - A "Copy JSON" button using `navigator.clipboard.writeText` with a toast confirmation
- Also log the same payload to the console when the dialog opens, so users who prefer DevTools have it handy.

## Out of scope
- No changes to what gets delivered, only visibility.
- No changes to `viewer-host.html` or the viewer bundle.
- No persistence of the dialog state.
