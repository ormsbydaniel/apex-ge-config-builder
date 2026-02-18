
# Root Cause Analysis: Configuration Loading Slowdown

## The Problem

The configuration loading slowdown (from seconds to over 1 minute) is caused by three distinct issues in `useConfigImport.ts` and `serviceCapabilities.ts`, all converging on the `Promise.all()` block that fetches capabilities for every service before loading the config.

The example config has **13 services**. At load time, the application tries to fetch capabilities for all of them in parallel but with no timeout protection.

---

## The Three Root Causes

### Cause 1: S3 service is not identified correctly, triggering a full bucket listing

The S3 service entry in the config uses `format: "cog"` but does **not** have `sourceType: "s3"`. The guard in `useConfigImport.ts` checks:

```typescript
if (service.sourceType === 's3') {  // <-- never true, no sourceType field in config
```

Because this never matches, the S3 service falls through to `fetchServiceCapabilities()`, which tries to construct a `GetCapabilities` URL from `https://esa-apex.s3.eu-west-1.amazonaws.com/` — this returns the full S3 XML listing (272 objects, seen in network logs). In the file-import path, `fetchS3BucketContents` is also guarded only by `sourceType`, not by URL pattern or format.

### Cause 2: STAC services are not skipped — they attempt OGC GetCapabilities calls

Both STAC services use `format: "stac"`. The `fetchServiceCapabilities` function only skips `format === 'xyz'` and constructs a `?service=STAC&request=GetCapabilities` URL. STAC endpoints are not OGC services, so this request will either:
- Return a 400/404 error (fast path, but error handling still takes time)
- Hang for a long time before timing out at the browser level

There is no `stac` skip in `fetchServiceCapabilities`.

### Cause 3: No timeout on any network request in the capability-fetching pipeline

`fetchServiceCapabilities` uses a bare `fetch()` with no `AbortController` timeout. If a service is slow (e.g., `https://services.terrascope.be/wms/v2` or `https://a.geoservice.dlr.de/eoc/land/wms/`), it can block the entire import for tens of seconds. This is the primary cause of the >1 minute loading time seen in the session replay.

---

## The Fix (Three Changes)

### Change 1: Add a timeout to `fetchServiceCapabilities`

Add an `AbortController` with a configurable timeout (default: **10 seconds**) to every fetch in `serviceCapabilities.ts`.

```typescript
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 10000);
const response = await fetch(capabilitiesUrl.toString(), { signal: controller.signal });
clearTimeout(timer);
```

This caps the worst-case wait to 10 seconds per service, and since all services load in parallel via `Promise.all`, the total wait time is bounded at ~10 seconds regardless of how many services there are.

### Change 2: Skip STAC services in `fetchServiceCapabilities`

Add `stac` to the formats that are skipped early in `fetchServiceCapabilities`:

```typescript
if (format === 'xyz' || format === 'stac') {
  return null;
}
```

STAC services have their own discovery mechanism (STAC browser) and do not support OGC `GetCapabilities`.

### Change 3: Fix the S3 service detection in `useConfigImport.ts`

The S3 detection guard needs to also check whether the service URL matches an S3 URL pattern (the `sourceType` field is unreliable as it's not always present in imported configs). The fix is to add a URL-based check using the existing `parseS3Url` helper:

```typescript
// In both importConfig and importConfigFromUrl:
const isS3Service = service.sourceType === 's3' || parseS3Url(service.url) !== null;
if (isS3Service) {
  // ... S3 bucket listing path
}
```

Alternatively (and more conservatively), simply skip S3 bucket listing during import (it is not needed for loading the config — the capabilities are only used when adding layers interactively) and treat S3 services the same as non-fetchable services during import:

```typescript
if (service.sourceType === 's3' || service.format === 'cog') {
  return service; // skip, no GetCapabilities for COG/S3
}
```

---

## Summary of Files to Change

| File | Change |
|---|---|
| `src/utils/serviceCapabilities.ts` | Add 10s `AbortController` timeout to the fetch; skip `stac` format |
| `src/hooks/useConfigImport.ts` | Fix S3 service detection to also match by URL pattern or skip COG-format services |

---

## Expected Result

With these three fixes:
- STAC services: skipped immediately (0ms overhead)
- S3 services: skipped during import (0ms overhead, bucket listing still works when browsing interactively)  
- Slow WMS/WMTS services: capped at 10 seconds, after which they load without capabilities (capabilities can be re-fetched interactively)
- The expected loading time returns to **under 10 seconds** even for configs with many services

---

## Technical Notes

- These fixes apply to **both** `importConfig` (file upload) and `importConfigFromUrl` (example loader) — they share the same capability-fetching pattern
- The 10-second timeout is conservative; most healthy WMS services respond in under 2 seconds. It could be reduced to 8 seconds if preferred
- Service capabilities are non-critical for loading — they only populate the layer name dropdowns when editing. The app works correctly without them
