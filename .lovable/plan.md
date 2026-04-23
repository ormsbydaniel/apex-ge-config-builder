

## Group bulk validation by service kind

Replace the single "Checking N of M services…" strip with three parallel, kind-aware passes — STAC, OGC services (WMS/WMTS/WFS), and S3 — each with its own progress line and its own success metric.

### UX

Header strip becomes a small stack (only kinds with work to do are shown):

```
🔄 Checking STAC catalogues (2 of 3)…
🔄 Checking WMS / WMTS / WFS services (4 of 7)…
🔄 Checking S3 stores (1 of 2)…
```

Each line disappears once that group finishes. When all three finish, the strip disappears entirely.

Per-card success badge wording stays kind-appropriate (already does today):
- **STAC** → "N collections available"
- **OGC** → "N layers available"
- **S3** → "Endpoint reachable" (or "N objects available" if listing succeeded — see below)

Failures: amber "Couldn't reach endpoint" / "Couldn't fetch capabilities" / "Couldn't list bucket" with **Retry**, same pattern as today.

**Re-check all** runs all three groups in parallel, same UI.

### Validation per kind

| Kind | Detection | Success criterion | Capability stored |
|---|---|---|---|
| **STAC** | `format === 'stac'` or `sourceType === 'stac'` | `fetchStacCatalogue` returns capabilities (uses `totalCount` for collection count) | `{ layers, totalCount, title, abstract }` |
| **OGC** | format ∈ `wms`/`wmts`/`wfs` and not S3/STAC | `fetchServiceCapabilities` returns non-null | `{ layers, title, abstract }` |
| **S3** | `format === 's3'`, `sourceType === 's3'`, or `parseS3Url(url) !== null` | HEAD the bucket root (cheap reachability check). If 200/403 → reachable. Optionally also call `fetchS3BucketContents` and store object count when CORS allows. On HEAD failure → error. | `{ layers: [], title: 'S3 bucket reachable' }` minimal stub if listing fails; or full listing if it succeeds |

WFS support: `fetchServiceCapabilities` already accepts `format: DataSourceFormat` and dispatches the proper `service=WFS&request=GetCapabilities` call when the format is `wfs` (verify existing branch; if missing, add a minimal WFS branch returning `{ layers, title, abstract }` from `FeatureType` elements).

### Implementation

**1. Refactor `src/hooks/useBulkServiceValidation.ts`**

- Add a `kind` classifier:
  ```ts
  type ServiceKind = 'stac' | 'ogc' | 's3';
  const classify = (svc: Service): ServiceKind | null => { … }
  // returns null for services that should be skipped entirely (e.g., file:// uploads with no real URL)
  ```
- Replace single `totalToCheck` / `completed` / `inFlight` with a per-kind record:
  ```ts
  type GroupProgress = { total: number; completed: number; inFlight: number };
  const [progress, setProgress] = useState<Record<ServiceKind, GroupProgress>>({
    stac: { total: 0, completed: 0, inFlight: 0 },
    ogc:  { total: 0, completed: 0, inFlight: 0 },
    s3:   { total: 0, completed: 0, inFlight: 0 },
  });
  ```
- Replace the single `validateOne` with three: `validateStac`, `validateOgc`, `validateS3`. Each updates only its own group's progress and the shared `statuses` map; each dispatches `UPDATE_SERVICE` with `{ capabilities }` on success.
  - `validateStac` calls a new exported helper extracted from `useServices.fetchStacCatalogue` (move into `src/utils/stacCapabilities.ts` to make it reusable outside React state). Toasts removed in the extracted version (silent for bulk; UI signals via badge).
  - `validateOgc` calls existing `fetchServiceCapabilities`.
  - `validateS3` does `fetch(rootUrl, { method: 'HEAD' })`. If response.ok or status 403 (common for bucket-list-denied but reachable), mark `ok` with stub capabilities; else `error`. (Optional follow-up: also try `fetchS3BucketContents` and prefer that if it succeeds.)
- Run all three groups concurrently, each with its own bounded concurrency (`CONCURRENCY = 4` per group is fine).
- Auto-trigger guard (`validatedForLoadRef === lastLoaded`) and `recheck(serviceId?)` API stay.
- Return shape changes:
  ```ts
  { statuses, progress, recheck }
  ```
  Helpers: `inFlightTotal = sum(progress.*.inFlight)`, derived in the consumer.

**2. Update `src/components/ServicesManager.tsx`**

- Replace the single progress strip with a small block that conditionally renders one row per kind where `progress[kind].total > 0 && progress[kind].completed < progress[kind].total`:
  ```tsx
  {progress.stac.inFlight > 0 && <Row label="STAC catalogues" {...progress.stac} />}
  {progress.ogc.inFlight > 0  && <Row label="WMS / WMTS / WFS services" {...progress.ogc} />}
  {progress.s3.inFlight > 0   && <Row label="S3 stores" {...progress.s3} />}
  ```
  (Use `inFlight > 0` to avoid flicker after a group finishes.)
- Update the **Re-check all** disabled condition: enabled whenever any service exists (since all three kinds are now checked). Spinner shows while any group has `inFlight > 0`.
- Per-card badge: keep current logic but for S3 services with `ok` status and an empty `layers` array, show "Endpoint reachable" instead of "0 objects available".

**3. New util: `src/utils/stacCapabilities.ts`**

Extract the catalog/openEO logic from `useServices.fetchStacCatalogue` into a pure async function `fetchStacCapabilities(url): Promise<ServiceCapabilities | null>` (no React state, no toasts). Have `useServices` re-import and wrap it with toast/loading state to preserve current add-flow UX.

**4. WFS sanity check**

Open `src/utils/serviceCapabilities.ts` and confirm WFS handling. If WFS isn't currently parsed (the current summary shows only WMS/WMTS), add a minimal WFS branch:
- URL: `?service=WFS&request=GetCapabilities&version=2.0.0`
- Parse `FeatureType` elements → `{ name, title, abstract }`
- Same 10s timeout / AbortController.

If WFS is intentionally out of scope, drop "WFS" from the strip wording and from the OGC classifier — but the user explicitly mentioned W?S, so adding it is preferred.

### Files touched

- **Edit**: `src/hooks/useBulkServiceValidation.ts` — kind classifier, per-group progress, three validators.
- **Edit**: `src/components/ServicesManager.tsx` — three-row progress strip, S3-specific success wording, re-check button enable condition.
- **New**: `src/utils/stacCapabilities.ts` — pure STAC capability fetcher extracted from `useServices`.
- **Edit**: `src/hooks/useServices.ts` — delegate `fetchStacCatalogue` to the new util (preserves toasts/loading).
- **Edit (conditional)**: `src/utils/serviceCapabilities.ts` — add WFS branch if missing.

### Out of scope

- Persisting S3 object counts when bucket listing is CORS-blocked (we accept "reachable" as success).
- Changing the per-service `capabilities` schema. STAC keeps using `totalCount`; S3 reachable-only stores empty layers.
- Caching across sessions. Same as today: `lastLoaded` resets the guard.

