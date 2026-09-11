# Add top-level `settings` block (schema + round trip only)

Add support for a new top-level configuration block:

```json
"settings": {
  "layerFetchTimeoutMs": 5000
}
```

No UI controls in this change. The block can be added or edited by hand in the JSON Config editor, survives validation, and is preserved when a configuration is exported and re-imported.

## Behaviour

- `settings` is optional. Configurations without it are unaffected.
- `layerFetchTimeoutMs` is an optional positive whole number (milliseconds).
- Unknown keys inside `settings` are kept rather than dropped, so future settings added upstream are not silently lost on a round trip.
- If `settings` is absent, nothing is written to the exported file.

## Technical changes

1. `src/schemas/configSchema.ts` — add `SettingsSchema` (`z.object({ layerFetchTimeoutMs: z.number().int().positive().optional() }).passthrough()`) and `settings: SettingsSchema.optional()` to `ConfigurationSchema`. Without this the top-level key is stripped during validation.
2. `src/types/config.ts` — add the matching optional `settings` field / `AppSettings` interface so consumers are typed. (`ConfigState` extends `ValidatedConfiguration`, so context picks it up automatically.)
3. `src/contexts/ConfigContext.tsx` — `LOAD_CONFIG` builds `normalizedPayload` by spreading the payload, so `settings` carries through; no default is injected. Confirm no sanitisation path removes it.
4. Export paths — add `...(config.settings && { settings: config.settings })` in the same position (after `exclusivitySets`) to:
   - `src/hooks/useConfigExport.ts`
   - `src/hooks/useConfigSanitization.ts` (drives the JSON Config preview)
   - `src/pages/ConfigJson.tsx` (`/config.json` route)
5. Import needs no transformer change — `normalizeImportedConfig` passes unknown top-level keys through and validation now accepts them.

## Verification

Add a round-trip unit test alongside `src/hooks/__tests__/configRoundTrip.workflows.test.ts` asserting that a config containing `settings.layerFetchTimeoutMs` validates, survives load, and appears unchanged in the export payload.
