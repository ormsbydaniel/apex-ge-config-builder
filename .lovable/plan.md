## Add `exportPrefix` setting and timestamped export filenames

### Behaviour

- Add a new top-level JSON config property:
  ```json
  "exportPrefix": "config_biodiversity"
  ```
- Add an editable field on the Settings page so the prefix can be set per config.
- When exporting, use:
  ```text
  {exportPrefix}_YYYYMMDD_HHMM.json
  ```
  Example:
  ```text
  config_biodiversity_20260424_1430.json
  ```
- If `exportPrefix` is blank or missing, fall back to `config`, producing e.g. `config_20260424_1430.json`.
- Sanitize the filename prefix for safety: trim whitespace, convert spaces to `_`, and strip characters that are invalid/problematic in filenames.

### Implementation

1. **Schema and state**
   - Add optional `exportPrefix` to `ConfigurationSchema` in `src/schemas/configSchema.ts`.
   - Add `exportPrefix` to the initial config state in `src/contexts/ConfigContext.tsx`, defaulting to `config`.
   - Add a reducer action such as `UPDATE_EXPORT_PREFIX` that updates the top-level field and marks the config dirty.
   - Ensure loaded configs preserve an existing `exportPrefix` and older configs without it continue to load.

2. **Settings UI**
   - Edit `src/components/config/SettingsTab.tsx` to add an “Export Settings” row/card near the general Settings controls.
   - Include an input labelled “Export filename prefix”.
   - Show helper text explaining the output pattern: `{prefix}_YYYYMMDD_HHMM.json`.
   - Dispatch `UPDATE_EXPORT_PREFIX` when the input changes, following the existing SettingsTab dispatch pattern.

3. **Export JSON content**
   - Include `exportPrefix` in generated JSON in:
     - `src/hooks/useConfigExport.ts`
     - `src/pages/ConfigJson.tsx`
     - `src/hooks/useConfigSanitization.ts`
   - This keeps downloaded export, JSON preview/route, and sanitized config output aligned.

4. **Export filename**
   - In `src/hooks/useConfigExport.ts`, replace the hardcoded `config.json` download filename.
   - Generate a local timestamp with zero-padded date/time: `YYYYMMDD_HHMM`.
   - Build `a.download` from the sanitized prefix and timestamp.
   - Update the export toast description to mention the actual filename.

### Technical notes

- No broad refactor: this is a small, targeted addition following the existing ConfigContext + SettingsTab patterns.
- No changes to service validation or load-performance logic.
- Backwards compatibility is maintained because `exportPrefix` is optional in the schema and defaults in app state/export naming.