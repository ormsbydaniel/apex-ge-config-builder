

# S3-Hosted Viewer Bundles with Dynamic Version Discovery

## Overview

Move viewer bundles from the private GitHub repo to a **public S3 bucket**, and **dynamically discover versions** by listing the S3 bucket contents -- eliminating the need to maintain a static `versions.json` manifest.

## How It Works

The S3 bucket would be structured as:

```text
s3://apex-viewer-bundles/
  3.5.0/
    bundle.js
    bundle.css
    assets/
      chunk-abc123.js
  3.6.0/
    bundle.js
    bundle.css
    assets/
      chunk-def456.js
```

S3 supports listing bucket contents via its **ListObjectsV2** REST API. When the bucket is public, this can be called unauthenticated from the browser using a simple `fetch()` to:

```
https://<bucket>.s3.<region>.amazonaws.com/?list-type=2&delimiter=/
```

This returns an XML response listing the top-level "folders" (common prefixes), which correspond to version numbers. The app parses these prefixes to build the version dropdown dynamically.

## Key Benefits

1. **No more `versions.json` to maintain** -- versions are discovered from S3 prefixes automatically.
2. **Correct MIME types** -- S3 serves `.js` files as `application/javascript`, so the Blob URL workaround and the service worker are no longer needed.
3. **Dynamic chunks work** -- Since MIME types are correct and URLs are direct, Vite's code-splitting with dynamic `import()` works out of the box.
4. **Simple deployment** -- Upload a new version folder to S3 and it appears in the dropdown.

## Changes Required

### 1. Update `src/config/viewerBundleConfig.ts`
- Replace the GitHub raw URL with the S3 bucket URL (e.g., `https://apex-viewer-bundles.s3.eu-west-2.amazonaws.com/viewer`).
- Remove the GitHub-specific constants.

### 2. Rewrite `src/utils/viewerVersions.ts`
- Replace `fetch('/viewer/versions.json')` with an S3 ListObjectsV2 request.
- Parse the XML response to extract common prefixes (folder names) as version strings.
- Determine `latest` by sorting versions using the existing `compareVersions` function rather than relying on a manifest field.
- Keep the same `ViewerVersion` return type for compatibility.

### 3. Simplify `public/viewer/viewer-host.html`
- Remove the Blob URL / text-fetch workaround. Since S3 serves correct MIME types, load `bundle.js` directly as a `<script type="module">`.
- Keep the `window.explorerConfig` pattern: the host sets `window.explorerConfig` on the iframe before the script loads.

### 4. Update `src/hooks/useViewerLoader.ts`
- Replace the `postMessage` config delivery with the `window.explorerConfig` approach:
  - Before setting `iframe.src`, set `iframe.contentWindow.explorerConfig = config` (or do it in the host HTML via a query-param-passed config URL).
  - For live config updates, access `iframe.contentWindow.queryClient.invalidateQueries(['config'])` after updating the global.
- Keep the legacy polling for older versions (3.5.0 and below) that use `initApexViewer`.
- Remove the 30-second timeout error message referencing local `/viewer/` paths; update messaging to reference S3.

### 5. Clean up
- Delete `public/viewer/versions.json` (no longer needed).
- Delete `public/viewer/viewer-sw.js` (no longer needed).
- Remove any local viewer bundle folders from `public/viewer/` if present (they are served from S3 now).

## S3 Bucket Setup (Your Side)

Before implementation, you will need to:
1. **Create a public S3 bucket** (or use an existing one) with a suitable name.
2. **Enable public read access** via a bucket policy allowing `s3:GetObject` and `s3:ListBucket` for `*`.
3. **Configure CORS** on the bucket to allow requests from your app's origin.
4. **Upload version folders** with the structure `{version}/bundle.js`, `{version}/bundle.css`, `{version}/assets/*`.
5. Provide the bucket URL so I can wire it into the config.

## Technical Detail: S3 Version Listing

The browser-side fetch to list versions would look like:

```typescript
const res = await fetch('https://<bucket>.s3.<region>.amazonaws.com/?list-type=2&delimiter=/');
const xml = await res.text();
const parser = new DOMParser();
const doc = parser.parseFromString(xml, 'application/xml');
const prefixes = doc.querySelectorAll('CommonPrefixes > Prefix');
const versions = Array.from(prefixes)
  .map(p => p.textContent?.replace(/\/$/, '') || '')
  .filter(v => v.length > 0);
```

This returns folder names like `3.5.0`, `3.6.0`, etc., which become the version dropdown items.

