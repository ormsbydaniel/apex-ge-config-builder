# Extend Run Data Source Validation

Add two new diagnostics to the existing bulk validation flow:

1. **Slow / large GetCapabilities** — warn when an OGC or STAC capabilities response is slow or large.
2. **Large GeoJSON files** — HEAD-check GeoJSON layer data sources and warn when oversized.

Both surface alongside the existing pass/fail badges as a new `'warning'` status, without breaking the current `ok` / `error` flow.

## Thresholds (initial defaults)

- GetCapabilities slow:  > 3000 ms
- GetCapabilities large: > 2 MB (response bytes)
- GeoJSON large:         > 10 MB (Content-Length)

These will live as named constants at the top of `useBulkServiceValidation.ts` so they're easy to tune.

## Scope

### 1. Status model

In `src/hooks/useBulkServiceValidation.ts`:

- Extend `ServiceValidationStatus` to `'idle' | 'checking' | 'ok' | 'warning' | 'error'`.
- Add a parallel `warnings` map: `Record<string, string[]>` (one or more human-readable warning messages per service / source id), exposed on the hook return.
- A service that probes successfully but trips a threshold becomes `'warning'` (not `'error'`) so failure counts stay accurate.

### 2. Timing & size capture for GetCapabilities

- In `validateOgc` and `validateStac`, wrap the fetch with `performance.now()` start/end.
- Read response size from `Content-Length` header when present; otherwise fall back to `response.clone().text().length` (already read for OGC; STAC reads JSON, so use the parsed body length or `Content-Length`).
- After a successful probe, if `duration > SLOW_MS` or `bytes > LARGE_BYTES`, push a warning string and set status to `'warning'`.
- To keep the change contained, `fetchServiceCapabilities` and `fetchStacCapabilities` will gain an optional second return shape (object with `{ capabilities, durationMs, bytes }`) via a thin wrapper used only by the validation hook — the existing call sites keep working unchanged.

### 3. New GeoJSON group

- Add a fourth probe kind: `'geojson'`.
- Add `GroupProgress` entry for it in `INITIAL_PROGRESS`.
- Collect targets by walking the active config's **layer data sources** (not `services`). Source: `config.sources` (used elsewhere in the app); filter `d.format === 'geojson'` with a non-empty URL.
- Probe = `fetch(url, { method: 'HEAD' })` with 10s timeout.
  - Network error / non-2xx → `'error'`.
  - `Content-Length` missing → `'ok'` with a soft warning ("size unknown").
  - `Content-Length > GEOJSON_LARGE_BYTES` → `'warning'` with the formatted size.
  - Otherwise → `'ok'`.
- Keyed by data-source id (sources already have stable ids).

### 4. UI surface

In `src/components/ServicesManager.tsx`:

- Add a fourth row to the run summary panel: "GeoJSON sources — N checked, M warnings, K failures".
- Service/source cards: render a yellow warning badge (using existing `Badge` + `AlertTriangle` icon already imported) when status is `'warning'`, with a tooltip listing the warning messages from the new `warnings` map.
- Failed-services list: include warnings as a separate, collapsible "Warnings" sub-section so they don't get conflated with hard failures.
- GeoJSON sources don't appear in the Services table today, so add a small "GeoJSON layer sources" section below the existing Services list (id, layer name, URL, status badge). Read-only — recheck button per row plus the existing global "Run Data Source Validation" button drives them.

### 5. Recheck wiring

- `recheck()` (no id) already runs everything; extend `runBulk` to also dispatch the new GeoJSON probes in parallel (4th `runWithConcurrency`).
- `recheck(id)` lookup: extend to find by data-source id when no service matches.

## Technical Details

Files to modify:

- `src/hooks/useBulkServiceValidation.ts` — status enum, warnings map, timing capture, GeoJSON probe, group progress, recheck wiring.
- `src/utils/serviceCapabilities.ts` — add an internal `fetchServiceCapabilitiesWithMetrics()` that returns `{ capabilities, durationMs, bytes }`; keep existing export unchanged.
- `src/utils/stacCapabilities.ts` — same pattern: `fetchStacCapabilitiesWithMetrics()`.
- New file `src/utils/geojsonProbe.ts` — `probeGeojsonSize(url, { timeoutMs, largeBytes })` returning `{ status: 'ok' | 'warning' | 'error', bytes?: number, message?: string }`.
- `src/components/ServicesManager.tsx` — render warning badges, new GeoJSON sources section, extend summary panel.

Constants (top of `useBulkServiceValidation.ts`):

```ts
const CAPABILITIES_SLOW_MS = 3000;
const CAPABILITIES_LARGE_BYTES = 2 * 1024 * 1024;
const GEOJSON_LARGE_BYTES = 10 * 1024 * 1024;
```

No schema or Zod changes — the new data is purely transient validation state.

## Out of scope

- Configurable thresholds in the UI (constants only for now; can be exposed later).
- GET fallback when HEAD is not allowed by the GeoJSON host — we'll surface "size unknown" as a soft note instead of downloading the whole file.
- FlatGeobuf size checks (it's a streaming format; size is less actionable).
