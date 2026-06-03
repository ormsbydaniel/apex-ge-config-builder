## Issue

`src/components/layers/ParametersEditor.tsx` lists `version` in `RESERVED_KEYS`, which marks the row as invalid and strips it on save. WMS callers legitimately need to pin `VERSION` (e.g. `1.1.1` vs `1.3.0`) since coordinate-axis order and SRS/CRS handling differ between versions.

## Change

In `src/components/layers/ParametersEditor.tsx`:

- Remove `'version'` from `RESERVED_KEYS` (line 18) so it becomes:
  ```ts
  const RESERVED_KEYS = ['time', 'layers', 'service', 'request'];
  ```

That single edit:
- Allows users to add `VERSION` (any case) as a parameter.
- Persists it through `rowsToRecord` into the saved config.
- Updates the inline help text automatically (it's generated from the array).

## Out of scope

- `time`, `layers`, `service`, `request` remain reserved (the viewer/OGC pipeline owns them).
- No schema or type changes needed — parameters are already a free-form `Record<string, string>`.
- No viewer-side change required; it already forwards extra params on WMS requests.
