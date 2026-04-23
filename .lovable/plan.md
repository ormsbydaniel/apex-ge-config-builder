

## Remove "Full load (pre-fetch capabilities)" option from Load Configuration dialog

### Why

The checkbox is now redundant:
- The Services tab auto-runs bulk validation the first time it's opened after a config load (`useBulkServiceValidation`), with per-group progress, status badges, the failures section, and module-level caching so it doesn't re-run on tab switches.
- Other consumers fetch capabilities lazily on first use.
- Pre-fetching at load time just front-loads work the user will see anyway in the Services tab a moment later, and complicates the load dialog with a second progress view, a "Skip remaining" button, a summary screen, and a hold-open-after-success branch.

Quick load (deferred capabilities) becomes the only path — which is what nearly every load already is.

### Behaviour after change

- Load dialog shows: Parse → Normalize → Validate → Done. No capabilities stage, no per-service progress list, no summary panel.
- On success the dialog closes immediately (today's quick-load behaviour) for all sources (upload, examples, GitHub).
- Cancel button stays during loading; "Skip remaining" goes (no capabilities phase to skip).
- Service capability validation continues to happen automatically when the user opens the Services tab — unchanged.

### Implementation

**Edit only `src/components/config/LoadConfigDialog.tsx`:**

1. Delete `fullLoad` state and the checkbox UI block (the `<div>` containing the `Checkbox` with id `full-load`).
2. In `handleFile`, `handleLoadExample`, `handleLoadFromGithub`: drop `deferCapabilities: !fullLoad` (the import hook already defaults `deferCapabilities` to `true`).
3. In `renderLoadingView`:
   - Remove the "Full load / Quick load" descriptor line.
   - Remove the `capabilities` `StageRow`.
   - Remove the per-service progress `<ul>` block.
   - Remove the `summary` panel.
   - Remove the `Skip remaining` button branch.
4. In `finishLoading`: simplify to always close on success — drop the `fullLoad && capabilitiesAttempted` branch and the `summary`/`stage='done'` hold-open path.
5. Drop now-unused state: `summary`, `serviceProgress`, `progressTotal`, `progressDone`, `skippedRef`, and the `handleSkipRemaining` handler. Keep `stage` for parse/normalize/validate/done indicators and keep `abortRef` for `Cancel`.
6. In `handleProgress`: drop the `capabilities` branch (only `parse | normalize | validate | done` remain).
7. Remove now-unused imports (`X`, `XCircle`, possibly `Checkbox`) — verify with the linter after edit.

### Out of scope

- `useConfigImport.ts` — leave the `deferCapabilities` option intact (it just stops being toggled from this dialog; default is already `true`). Removing it from the API is a separate cleanup that risks touching other call sites.
- `useBulkServiceValidation` — unchanged.
- Failures-section UI on the Services tab — unchanged.

### Files

- **Edit**: `src/components/config/LoadConfigDialog.tsx` — remove the Full Load checkbox, capabilities-progress UI, summary screen, and related state/handlers.

