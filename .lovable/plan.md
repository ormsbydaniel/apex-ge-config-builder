## Goal

When a config fails Zod validation today, the load is aborted and the user sees a list of errors with no recovery path. Add two recovery actions to the validation error dialog:

1. **Remove invalid layers** — drop the offending sources and load the rest.
2. **Try to auto-fix** — apply targeted repair transformers to satisfy the schema, then re-validate.

## UX

In `ValidationErrorDialog` (and the import flow that surfaces it), add two buttons next to **Close**:

- **Remove invalid sources & load** — enabled only when every error path begins with `sources.<n>` (i.e. all failures are scoped to data sources). Disabled with tooltip otherwise.
- **Try to fix it & reload** — always enabled when there are source-level errors. Runs auto-repair, re-validates, and either loads the result or re-shows the dialog with whatever errors remain.

After either action the dialog closes on success and a toast summarises what happened (e.g. "Loaded config — removed 2 invalid sources" / "Auto-repaired 3 sources").

## Implementation

### 1. Plumb the raw JSON + retry through the dialog

`useConfigImport.runImport` already returns `errors` on failure. Extend `ImportResult` to also return `rawData` (the parsed-but-pre-validation object) so the dialog can operate on it without re-parsing. Pass the original `sourceLabel`/`loadedSource` back too, or expose a `retry(modifiedJson)` callback.

In `ConfigManagement` / `LoadConfigDialog` / `HomeTab` (the call sites that open `ValidationErrorDialog`), pass:
- `rawConfig: any` — parsed JSON used for repair.
- `onRetry: (config: any) => Promise<ImportResult>` — re-runs `runImport` with the modified object (skipping the parse step — see step 4).

### 2. "Remove invalid sources" action

Pure utility in `src/utils/configRecovery/removeInvalidSources.ts`:

```ts
export function removeInvalidSources(
  rawConfig: any,
  errors: ValidationErrorDetails[],
): { config: any; removed: { index: number; name: string }[] }
```

- Collect every distinct `sources.<n>` index from `errors[].path`.
- Filter `rawConfig.sources` to exclude those indices.
- Return the new config plus a list of what was removed (for the toast).

If a removed source was referenced by `exclusivitySets` or `interfaceGroups`, leave the references alone (existing sanitisation handles dangling references on load).

### 3. "Try to auto-fix" action

Reuse the existing `importTransformations` pipeline, plus a new repair-only pass that targets the most common version-drift failures we know about. New module `src/utils/configRecovery/autoFix.ts`:

```ts
export function autoFixConfig(
  rawConfig: any,
  errors: ValidationErrorDetails[],
): { config: any; appliedFixes: string[] }
```

Strategy — drive fixes by what the errors actually report, so we don't over-rewrite the config:

- For each `sources.<n>` error, look at the source and apply only the relevant repair:
  - **Base-layer meta** (the failure in the user's example): if `isBaseLayer === true` and `meta` is provided but missing `description` / `attribution.text`, fill defaults — same logic that `metaCompletionTransformer` already has, but invoked unconditionally on flagged sources rather than gated on detection.
  - **Layer-card meta missing**: if not a base layer and `meta` is absent or incomplete, synthesise it (description from `name`, attribution placeholder).
  - **Layout missing for layer cards**: insert minimal `layout: { interfaceGroup: '<first existing group or "Ungrouped">', layerCard: { toggleable: true } }`.
  - **`data` shape**: if a single object instead of array, wrap; if `format` missing but inferable from URL extension, fill it. (Both already covered by existing transformers — call them directly.)
  - **Unknown enum values**: if `format` is an unknown string, leave the source flagged for removal-fallback (do not silently change semantics).

- Track every fix applied as a string for the toast / follow-up dialog.

Re-run validation after the pass. If errors remain, re-show the dialog with the new error set and the same two buttons; the user can iterate ("fix again") or fall back to remove.

### 4. Re-validate without re-parsing

Add a `runImportFromObject(rawConfig, sourceLabel, loadedSource, options)` variant in `useConfigImport` that skips `parseJSONWithLineNumbers` and starts at `normalizeImportedConfig`. Both buttons call this with their modified config.

### 5. Files touched

- `src/utils/configRecovery/removeInvalidSources.ts` *(new)*
- `src/utils/configRecovery/autoFix.ts` *(new)*
- `src/utils/configRecovery/__tests__/*.test.ts` *(new — cover base-layer fix, missing layout, removal indices)*
- `src/hooks/useConfigImport.ts` — extract `runImportFromObject`, return `rawData` in `ImportResult`.
- `src/components/config/components/ValidationErrorDialog.tsx` — add the two action buttons + handlers, accept `rawConfig` and `onRetry` props.
- `src/components/ConfigManagement.tsx`, `src/components/config/HomeTab.tsx`, `src/components/config/LoadConfigDialog.tsx` — wire `rawConfig` and `onRetry` through to the dialog.

### Out of scope

- No schema changes. The Zod schema is the source of truth; recovery only edits user data.
- No automatic migration of old-version configs across the board — only opt-in, error-driven repairs.
- No changes to `validationUtils.ts` beyond what's needed to expose error paths (already exposed).
