# Investigate Preview config-loss regression

## What we know

- Your last prompt was docs-only. Diffing the last commit confirms only `docs/data-sources/wms-wmts-wfs.md` changed. A markdown change cannot cause a runtime regression in the viewer pipeline.
- The earlier "WMS parameters" change (loosened schema + preserve passthrough on edit) is still in place — the symptoms you are seeing now are the **same** symptoms as before that fix, which means either:
  1. The previous fix did not actually cover the code path you are exercising now, **or**
  2. The bug is reproduced by a different trigger (e.g. opening Preview from a particular state, or with a config that contains a field the schema still rejects).
- Console logs show the Preview page renders **twice**: first with the correct `SEF Demo - Urban Environments` layout, then with the default `Geospatial Explorer - Custom Config`. That means something is mutating `ConfigContext` after the config has loaded — it is not the viewer dropping the config, it is the builder's own state being reset.

## Plan

1. **Add narrow, one-shot logging** (no render-loop risk) at three points:
   - `ConfigContext` reducer: log every `LOAD_CONFIG` / `RESET_CONFIG` dispatch with `payload.layout?.navigation?.title` and a short stack trace.
   - `useValidatedConfig`: log only when it produces a result whose source count or layout title differs from the input (it should never).
   - `Preview.tsx`: log the `config` identity each render alongside the existing layout log.
   This pinpoints whether the reset is a dispatch or a stale-context read.

2. **Reproduce with the ECMWF config**:
   - Load the SEF config.
   - Click Preview.
   - Capture the new logs and identify which dispatch fires between the two `[Config Builder Preview]` renders.

3. **Fix at the source**. Likely candidates based on a quick scan:
   - `ConfigManagement.tsx` line 30 and `config/ConfigSummary.tsx` / `HomeTab.tsx` all dispatch `RESET_CONFIG` — verify none of them are being triggered by an effect on Preview entry.
   - `useConfigImport.ts` re-dispatches `LOAD_CONFIG`; check it is not re-running on navigation.
   - Schema validation: if any field in the SEF config still fails `DataSourceItemSchema` (despite the `parameters` widening), the loader may be replacing the config with defaults. Run the SEF config through `ConfigurationSchema.safeParse` in a throwaway script and dump the first error path.

4. **Remove the diagnostic logs** once the root cause is found and patched.

5. **Verify**: load the SEF config → Preview → confirm the layout title and full sources reach the viewer on every navigation, including a second Preview round-trip.

## Out of scope

- Any further changes to the WMS parameter editor or schema (the previous edit already widened `parameters` to `z.unknown()`).
- Refactoring `ConfigContext` or the validation pipeline beyond the targeted fix.

## Technical notes

- All logging must be guarded so it fires only on dispatches / mount, never inside render bodies that re-run on every keystroke — per the project's logging guideline.
- The fix should not touch documentation files; this regression is purely in the runtime config flow.
