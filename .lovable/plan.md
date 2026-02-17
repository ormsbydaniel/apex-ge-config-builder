
# Fix: Viewer Not Loading Due to Version Detection Bug

## Problem
The `isModernViewer()` function in `useViewerLoader.ts` fails to recognize `"3.6.0-rc"` as a modern viewer version. Its regex (`/^\d+\.\d+\.\d+$/`) only matches clean semver strings like `"3.6.0"` and rejects anything with a pre-release suffix.

Because the version is not detected as "modern", the host never sets `window.explorerConfig` on the iframe. The updated viewer then falls back to fetching `/config.json`, which does not exist, causing a JSON parse error and crash.

## Flow of the bug

```text
isModernViewer("3.6.0-rc")
  -> regex /^\d+\.\d+\.\d+$/ does NOT match "3.6.0-rc"
  -> returns false (legacy mode)
  -> explorerConfig never set on iframe window
  -> viewer queryFn: window.explorerConfig is undefined
  -> falls back to fetch("/config.json")
  -> SPA returns index.html (HTML)
  -> JSON.parse fails: "Unexpected token '<'"
  -> Crash: "Something went wrong!"
```

## Solution

Update `isModernViewer()` to handle pre-release suffixes by stripping them before the semver comparison.

### Changes

**File: `src/hooks/useViewerLoader.ts`**

Update the `isModernViewer` function (lines 23-31):

```typescript
function isModernViewer(version: string): boolean {
  // Dev/candidate builds for 3.6+ are modern
  if (version.startsWith('dev-3-6') || version.startsWith('dev-3.6')) return true;
  // Strip pre-release suffix (e.g., "3.6.0-rc" -> "3.6.0", "3.6.0-beta.1" -> "3.6.0")
  const baseVersion = version.replace(/-.*$/, '');
  // Must be a valid semver base (x.y.z)
  const semverRegex = /^\d+\.\d+\.\d+$/;
  if (!semverRegex.test(baseVersion)) return false;
  // compareVersions returns negative if a > b
  return compareVersions(baseVersion, '3.6.0') <= 0;
}
```

This strips everything after the first `-` before testing the semver regex and comparing versions, so `"3.6.0-rc"`, `"3.6.0-beta.1"`, `"3.7.0-alpha"`, etc. all correctly resolve as modern viewers.

No other files need changes.
