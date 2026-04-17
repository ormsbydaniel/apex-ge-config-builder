

## Goal

Show **what** was loaded beneath the existing "Last loaded: <date>" line on the Home tab — e.g., uploaded filename, "Example: <name>", or "GitHub: <owner/repo>@<branch>/<path>".

## Approach

Add a `lastLoadedSource` field to `ConfigState` that captures the origin of the most recent load, then display it under the existing timestamp.

### 1. State changes — `src/contexts/ConfigContext.tsx`

- Add to `ConfigState`:
  ```ts
  lastLoadedSource: { type: 'upload' | 'example' | 'github' | 'url'; label: string } | null
  ```
- Extend `LOAD_CONFIG` action payload to optionally carry a `source` descriptor (or add a separate `SET_LOAD_SOURCE` action dispatched alongside).
- In the `LOAD_CONFIG` reducer case, set `lastLoadedSource` from the payload (default `null` if not provided to stay backward compatible).
- `RESET_CONFIG` clears it.

### 2. Import hook — `src/hooks/useConfigImport.ts`

- `importConfig(file)` → dispatches with `source: { type: 'upload', label: file.name }`.
- `importConfigFromUrl(url, source?)` → accept an optional `source` descriptor and pass it through. Callers that already have richer context (GitHub repo/branch/path, example name) supply it.

### 3. Caller updates — `src/components/config/LoadConfigDialog.tsx`

- **Upload tab**: relies on `importConfig(file)` — automatic.
- **Examples tab**: pass `{ type: 'example', label: <example display name> }`.
- **GitHub tab**: pass `{ type: 'github', label: \`${repo}@${branch}/${path}\` }`.

### 4. Display — `src/components/config/HomeTab.tsx` (around lines 451–458)

Beneath the "Last loaded: <date>" line add a second line when `config.lastLoadedSource` is present:

```
Source: <icon> <label>
```

- Use small muted text (`text-xs text-muted-foreground`) with an inline icon per type (Upload / Sparkles / Github).
- Long GitHub paths get `truncate` + a `title` attribute for the full string (matches existing URL-display rules).

### Out of scope

- `ConfigSummary.tsx` and `ConfigManagement.tsx` keep their current minimal displays; only HomeTab shows the new "Source" line per the user's request.

## Files touched

- `src/contexts/ConfigContext.tsx` — add `lastLoadedSource` to state, types, reducer, initial/reset.
- `src/hooks/useConfigImport.ts` — accept and dispatch source descriptor in `importConfig` and `importConfigFromUrl`.
- `src/components/config/LoadConfigDialog.tsx` — pass source descriptor for examples and GitHub loads.
- `src/components/config/HomeTab.tsx` — render the new "Source: …" line below "Last loaded".

