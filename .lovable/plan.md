

## Problem

Loading a config with many services triggers a `Promise.all` over `fetchServiceCapabilities` (10s timeout each). The dialog gives no feedback — it stays on the upload tab, the "Choose file" button remains active, and the only spinner is a tiny app-wide one outside the modal. Users assume it hung and re-trigger the upload, compounding the problem.

## Proposed UX

Make the load operation **visible, cancellable, and non-blocking by default**.

### 1. Progress overlay inside the Load dialog

After a file is chosen (or example/GitHub item picked), the dialog content swaps to a **Loading view** (replaces the tabs, same dialog). It shows:

- Filename / source label being loaded
- Stages with checkmarks: `Parsing JSON → Validating schema → Fetching service capabilities (3/12) → Done`
- A live list of services as they complete: `✓ NDVI WMS`, `⏳ Sentinel-2 WMTS`, `⚠ Land cover (timed out, will use without capabilities)`
- A determinate `<Progress>` bar driven by completed/total service count
- Buttons: **Skip remaining** (uses what's loaded so far, keeps services without capabilities) and **Cancel** (aborts entire load, restores previous config)

The dialog cannot be re-used to pick another file while loading — the file picker / examples / GitHub list are hidden behind this overlay so accidental re-clicks are impossible.

### 2. Parallel-but-bounded capability fetching with per-service progress

Replace the single `Promise.all` in `useConfigImport.ts` with a small concurrency-limited runner (e.g. 4 in flight at once) that emits progress events. For each non-S3/non-STAC service:

- Start fetch with `fetchServiceCapabilities` (already has a 10s `AbortController`)
- On settle (success / timeout / error), emit `{ index, name, status }` to the caller
- A user-triggered `Skip remaining` cancels in-flight `AbortController`s and resolves the queue; services without capabilities are loaded as-is (browsing later still works, capabilities are re-fetched lazily on demand).

This keeps the existing import pipeline intact — only the orchestration changes.

### 3. Faster default: skip capabilities at load time, fetch lazily

Capabilities are only strictly needed when a user opens a service's layer picker. Add an option (default **on**) to **defer capability fetching**:

- Load completes immediately after Zod validation.
- Services are stored without `capabilities`.
- The first time a service is opened in the layer picker / `ServiceCardList` (or when a layer's display name needs capabilities for legend/bbox), `fetchServiceCapabilities` is triggered on-demand and cached into the service via `UPDATE_SERVICE`.
- A small "Refresh capabilities" action in the services manager triggers a manual refetch.

Behaviour switch in the load dialog:

- **Quick load (default)**: skips capabilities, loads in <1s.
- **Full load** checkbox: runs the full progress flow above for users who want everything pre-warmed.

This is the biggest UX win — a 50-service config now loads instantly.

### 4. API surface changes

- `useConfigImport.importConfig(file, options?)` and `importConfigFromUrl(url, source?, options?)` accept:
  ```ts
  type ImportOptions = {
    deferCapabilities?: boolean;          // default true
    onProgress?: (e: ImportProgress) => void;
    signal?: AbortSignal;                 // for full cancel
  };
  type ImportProgress =
    | { stage: 'parse' | 'validate' | 'normalize' | 'done' }
    | { stage: 'capabilities'; index: number; total: number; serviceName: string; status: 'pending' | 'ok' | 'error' | 'skipped' };
  ```
- Existing callers continue to work (defaults preserve current behaviour where it matters).

### 5. Dialog doesn't auto-close on success when "Full load" is in progress

Closing only happens once the loading view's `Done` stage is reached, so the user sees the final summary (`Loaded 12 services, 2 capabilities skipped`) and dismisses themselves. Quick-load auto-closes as today.

### 6. Lazy capability hook

Add `src/hooks/useLazyServiceCapabilities.ts` — given a `Service`, returns `{ capabilities, isLoading, error, refetch }`. It checks the in-memory service first, otherwise fetches and dispatches `UPDATE_SERVICE` to cache. Used by `ServiceCardList` / `ServiceSelectionModal` consumers that previously assumed capabilities were always present.

### Out of scope

- Persisting capabilities to localStorage between sessions (can follow up).
- Background prefetching of capabilities after load completes (optional follow-up — could run silently with the same concurrency runner).

## Files touched

- `src/hooks/useConfigImport.ts` — add `ImportOptions`, replace `Promise.all` with bounded concurrency runner, emit progress, support `signal` for cancel, default `deferCapabilities: true`.
- `src/components/config/LoadConfigDialog.tsx` — add Loading view (progress bar, per-service list, Skip/Cancel buttons), "Full load" checkbox, hold dialog open during full load, wire `onProgress` + `AbortController`.
- `src/hooks/useLazyServiceCapabilities.ts` *(new)* — on-demand capability fetch + cache via `UPDATE_SERVICE`.
- `src/components/form/ServiceConfigSection.tsx` and `src/components/layers/components/ServiceSelectionModals.tsx` — call the lazy hook so layer picker still works when capabilities weren't pre-fetched. Show small inline spinner the first time a service is opened post-deferred-load.
- `src/contexts/ConfigContext.tsx` — ensure `UPDATE_SERVICE` (or add it if missing) merges `capabilities` into the existing service entry without disturbing other fields.

