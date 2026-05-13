# Better service-add failure diagnostics

Today, when adding a STAC / WMS / WMTS / WFS / S3 service, a failure surfaces as a single generic line ("Couldn't fetch capabilities", "Couldn't fetch STAC catalogue"). The browser actually has enough signal to distinguish many failure modes — we just throw it away inside `serviceCapabilities.ts` (catch returns `null`), `stacCapabilities.ts`, and the bare `fetch` in `serviceProbes.ts`.

This plan adds a structured diagnostic result so the modal can show *what* went wrong and *what to try next*, without changing how successful adds work.

## Failure modes we can detect

From a single browser-side `fetch`, these are reliably distinguishable:

| Category | How we detect it | Suggested guidance |
|---|---|---|
| Invalid URL | `new URL(url)` throws | "URL is not well-formed" |
| Mixed content | page is `https:`, URL is `http:` (existing `checkMixedContent`) | "Browsers block HTTP requests from HTTPS pages — use https://" |
| Timeout | `AbortError` after our 10s `AbortController` | "Server did not respond within 10s" |
| DNS / offline / connection refused | `TypeError` from `fetch` AND `navigator.onLine === false` OR no response object | "Endpoint unreachable — check the host name or your network" |
| CORS blocked | `TypeError` from `fetch` while `navigator.onLine === true`, no `response` available, request was cross-origin | "Server reachable but did not return CORS headers — the endpoint must allow this origin" (likeliest cause of opaque `TypeError`s on cross-origin GET) |
| HTTP 401 / 403 | `response.status` | "Endpoint requires authentication / access denied" |
| HTTP 404 | `response.status` | "Not found — check the path; for WMS/WMTS the URL should be the service endpoint, not a tile URL" |
| HTTP 5xx | `response.status` | "Server error HTTP {status} — try again later" |
| HTTP 3xx with `type === 'opaqueredirect'` | redirect to a host that doesn't allow CORS | "Endpoint redirected to a location the browser can't follow — try the redirect target directly" |
| Wrong content type | `Content-Type` is `text/html` for a capabilities request | "Server returned HTML — likely a login or error page, not a capabilities document" |
| XML parse error (OGC) | existing `parsererror` branch | "Response wasn't valid XML — the URL may not be a {WMS|WMTS|WFS} GetCapabilities endpoint" |
| JSON parse error (STAC) | `JSON.parse` throws | "Response wasn't valid JSON — the URL may not be a STAC catalogue/collection" |
| Empty capabilities (parsed OK, 0 layers/collections) | post-parse | Already implied by success path; we'll flag it as a warning, not an error |
| S3 listing denied but HEAD ok | existing branch | Keep current "reachable, listing not permitted" message |

CORS vs DNS disambiguation is heuristic (browsers deliberately don't tell us which), but `navigator.onLine` plus same-origin check covers the common cases well enough to give useful guidance.

## Code changes

### 1. New `src/utils/serviceDiagnostics.ts`

Pure helpers, no network calls:

- `type ProbeFailureCategory = 'invalid-url' | 'mixed-content' | 'timeout' | 'network' | 'cors' | 'http-auth' | 'http-not-found' | 'http-server' | 'http-other' | 'bad-content-type' | 'parse-xml' | 'parse-json' | 'empty' | 'unknown'`
- `interface ProbeDiagnostic { category: ProbeFailureCategory; title: string; detail?: string; hint?: string; httpStatus?: number; durationMs?: number }`
- `classifyFetchError(err: unknown, ctx: { url, sameOrigin, durationMs }): ProbeDiagnostic` — maps `AbortError`, `TypeError`, etc. into the table above.
- `classifyHttpResponse(res: Response): ProbeDiagnostic | undefined` — returns a diagnostic when `!res.ok` or content-type is suspicious; `undefined` when fine.
- `formatDiagnostic(d: ProbeDiagnostic): string` — single-line fallback for callers that still want a string.

### 2. Refactor `src/utils/serviceCapabilities.ts`

Replace the silent `catch → return { capabilities: null }` with a `diagnostic` field on the result:

```ts
export interface ServiceCapabilitiesMetrics {
  capabilities: ServiceCapabilities | null;
  diagnostic?: ProbeDiagnostic; // present iff capabilities === null
  durationMs?: number;
  bytes?: number;
}
```

Wrap the existing fetch + parse blocks so:
- AbortError → `timeout`
- `!response.ok` → `classifyHttpResponse`
- `parsererror` → `parse-xml`
- empty `layers` after parse → `empty` (warning, capabilities still returned)
- otherwise → `unknown`

Keep the existing `fetchServiceCapabilities` wrapper unchanged so no other call sites break.

### 3. Mirror the same change in `src/utils/stacCapabilities.ts`

Add a `diagnostic` to its return, classify JSON parse failures as `parse-json`, HTTP errors via `classifyHttpResponse`.

### 4. Update `src/utils/serviceProbes.ts`

`ProbeResult` becomes:

```ts
interface ProbeResult {
  ok: boolean;
  message: string;            // existing one-liner — unchanged for callers
  diagnostic?: ProbeDiagnostic; // new
}
```

For each branch:
- `stac` and `ogc`: pass through the new `diagnostic` from the underlying capabilities call.
- `s3`: build diagnostics from the HEAD response status / classifyFetchError; preserve current "listing not permitted" success.
- Always run `checkMixedContent(url)` first and short-circuit with a `mixed-content` diagnostic.
- Always check `new URL(url)` first and short-circuit with `invalid-url`.

### 5. UI surfacing in the add-service / validate flow

`src/components/ServicesManager.tsx` (and the validate button in `useBulkServiceValidation.ts`) currently show `result.message`. Update the failure-state UI to render, when `diagnostic` is present:

- Bold one-line title (`diagnostic.title`)
- Optional muted detail line (`diagnostic.detail`, e.g. `HTTP 403 in 240 ms`)
- Optional hint line in `text-muted-foreground` (`diagnostic.hint`)

No layout/redesign work — reuse the existing failure block; just three stacked lines instead of one.

### 6. Tests

Add `src/utils/__tests__/serviceDiagnostics.test.ts` covering:
- AbortError → `timeout`
- `TypeError` + `navigator.onLine = false` → `network`
- `TypeError` + cross-origin → `cors`
- 401, 403, 404, 500 → matching categories with correct hints
- HTML content-type → `bad-content-type`
- Mixed content via `checkMixedContent` integration

## Out of scope

- No retry logic or proxy fallback.
- No backend/edge-function diagnostic probe (browser-side only — same constraints as today).
- No changes to bulk-validation table columns beyond rendering the existing message + hint.
- No changes to the auto-fix / remove-invalid-sources flow.

## Files touched

- new: `src/utils/serviceDiagnostics.ts`
- new: `src/utils/__tests__/serviceDiagnostics.test.ts`
- edit: `src/utils/serviceCapabilities.ts`
- edit: `src/utils/stacCapabilities.ts`
- edit: `src/utils/serviceProbes.ts`
- edit: `src/components/ServicesManager.tsx` (failure block only)
- edit: `src/hooks/useBulkServiceValidation.ts` (pass diagnostic through)
