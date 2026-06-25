# Auto-populate `serviceTitle` from the APEx catalogue on import

When a config is loaded, any workflow (algorithm) entry missing `serviceTitle` will be looked up against the default APEx Algorithm Catalogue and back-filled if a matching record is found.

## Behaviour

- Triggered after schema validation succeeds, before dispatching `LOAD_CONFIG`.
- Scans both top-level `workflows[]` and every source's `workflows[]`.
- Only entries where `serviceTitle` is missing/empty are considered.
- Matching rule: `entry.serviceProvider === catalogue.provider` AND `entry.serviceId === catalogue.record.id` (falling back to `catalogue.algorithmId`).
- If a match is found, set `serviceTitle` to the catalogue entry's title (`record.properties.title` or `entry.name`).
- If the catalogue can't be loaded (network failure) or no match is found, leave the entry untouched — never block the import.
- Show a toast addendum (e.g. "Populated titles for N algorithm(s) from the APEx catalogue.") only when at least one title was filled.
- Skipped entirely if no workflow entries are missing `serviceTitle` (avoids the catalogue fetch).

## Technical details

**File: `src/hooks/useConfigImport.ts`**
- Add a helper `enrichWorkflowsWithCatalogueTitles(config)` that:
  - Collects all workflow entries (top-level + per-source) missing `serviceTitle`.
  - Returns early with `{ config, filled: 0 }` if none.
  - Calls `loadCatalogue()` from `src/lib/catalogue/apexCatalogue.ts` (already cached after first call).
  - Builds a `Map<provider|id, title>` lookup once.
  - Returns a new config with titles filled in (immutably), plus a count.
  - Wraps the catalogue call in try/catch — on failure return original config + 0.
- Call this helper inside `runImportFromObject` after `ConfigurationSchema.parse(...)` and before `enrichServicesWithCapabilities` (or in parallel; sequential is simpler and fine since catalogue is cached/small).
- Append filled-count phrase to the success toast description when > 0.

**No schema, type, or UI changes.** `serviceTitle` is already optional on `WorkflowItemSchema` and present on `WorkflowItem`/`MappedWorkflowFields`.

## Out of scope

- Re-fetching the catalogue if it failed previously (the existing `loadCatalogue()` caching is sufficient).
- Populating other fields (description, serviceDetails). Only `serviceTitle` per the request.
- A manual "refresh titles from catalogue" action — can be added later if useful.
