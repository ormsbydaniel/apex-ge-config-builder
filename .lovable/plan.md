

## Validate services on Services tab visit (post Quick Load)

### Why

After a Quick Load, services arrive without `capabilities` (no GetCapabilities was fetched). Today they only get validated lazily when opened in the "Add Dataset → From Service" picker. Until then, the Services tab shows every loaded service with an orange **"Manual configuration required"** badge — misleading for services that are actually fine.

Trigger validation when the user first opens the Services tab so they get accurate status (layer counts, reachability) without paying the cost up front at load time.

### UX

- First time the Services tab becomes active in a session **and** there are services missing `capabilities`, kick off a background validation pass.
- Tab header shows a subtle progress strip: *"Checking 3 of 7 services…"* with a small spinner. Non-blocking — the user can edit/delete/scroll freely.
- Each service card without capabilities shows one of:
  - **Spinner + "Checking…"** while in-flight.
  - **Green "N layers available"** badge once capabilities resolve (existing UI, just driven by the new fetch).
  - **Amber "Couldn't fetch capabilities"** badge with a small **Retry** button on failure (replaces the current generic "Manual configuration required" only for *checked-and-failed* services; never-checked stays as today).
- Add a **"Re-check all"** button next to **Add Service** in the tab header. Always available; refetches all non-S3/STAC services and updates the cards in place.
- Validation only runs once per loaded config. Loading a new config resets the "already-validated" flag so the next Services-tab visit re-validates.
- S3 and STAC services are skipped (consistent with `useLazyServiceCapabilities` and import-time logic) — they don't use GetCapabilities.

### Implementation

**1. New hook: `src/hooks/useBulkServiceValidation.ts`**

Encapsulates the bulk fetch:
- Input: `services: Service[]`, `enabled: boolean`.
- Maintains per-service status (`'idle' | 'checking' | 'ok' | 'error'`) in local state.
- On `enabled` going true (and once per `lastLoaded` timestamp from `ConfigContext`), iterates non-S3/STAC services missing `capabilities`, calls `fetchServiceCapabilities` with bounded concurrency (reuse `CONCURRENCY = 4` pattern from `useConfigImport`), dispatches `UPDATE_SERVICE` with `{ capabilities }` on success.
- Exposes `{ statuses, inFlight, totalToCheck, completed, recheck(serviceId?) }`.
- A ref-based guard (`validatedForLoadRef.current === lastLoaded`) prevents re-running when navigating away and back.

**2. Wire into `ServicesManager.tsx`**

- Accept new optional `isActive: boolean` prop (true when the Services tab is selected). Use it as the `enabled` flag for the hook.
- Render the progress strip above the service list when `inFlight > 0`.
- Replace the static badge logic in the card (lines ~558–570) so badges reflect `statuses[service.id]`:
  - `checking` → spinner + "Checking…"
  - `ok` or `service.capabilities?.layers.length` → existing green badge
  - `error` → amber "Couldn't fetch" + small Retry button calling `recheck(service.id)`
  - `idle` (S3/STAC, or hook hasn't run yet) → existing fallback
- Add **Re-check all** button in the header next to **Add Service** (disabled while `inFlight > 0`).

**3. Wire `isActive` from `ConfigBuilder.tsx`**

The Tabs component's `value` prop already drives which tab is active. Pass `isActive={activeTab === 'services'}` to `ServicesManager`. (Need to lift the `value` into local state if it isn't already — currently `Tabs` uses defaultValue/uncontrolled. Convert to controlled with `useState('home')`.)

**4. Reset trigger**

Use `lastLoaded` from `useConfig()` as the reset key inside the hook — when a fresh config loads, `lastLoaded` changes, the guard ref no longer matches, and the next tab activation re-runs validation.

### Files touched

- **New**: `src/hooks/useBulkServiceValidation.ts` (~80 lines, mirrors the concurrency utility from `useConfigImport.ts` and the per-service caching from `useLazyServiceCapabilities.ts`).
- **Edit**: `src/components/ServicesManager.tsx` — accept `isActive`, render progress strip, drive card badges from hook state, add Re-check all + per-card Retry.
- **Edit**: `src/components/ConfigBuilder.tsx` — make `Tabs` controlled, pass `isActive` to `ServicesManager`.

### Out of scope

- Triggering validation on other tabs (Layers etc.) — only the Services tab presents per-service status, so no benefit elsewhere.
- Re-validating already-cached services — only services missing `capabilities` are checked. "Re-check all" is the explicit override.
- Changing the import-time `deferCapabilities` default — Quick Load remains fast; this plan complements it, not replaces it.

