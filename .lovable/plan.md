# Workflow Catalogue Browser — v1 Plan

Open a full-screen modal from the Edit Workflow dialog that lists algorithms from the `ESA-APEx/apex_algorithms` GitHub repo (pinned to `main`), lets the user search and pick one, and pre-fills the workflow form fields (which remain editable).

## Scope

**In:** list + search + pick, columns Name / Provider / Description, pre-fill `serviceId`, `serviceProvider`, `serviceDetails.{endpoint,namespace,application}` based on `conformsTo`.
**Out (later):** thumbnails, keyword/theme facets, "open in openEO editor" / "view on GitHub" links, commit-sha pinning, caching beyond in-memory.

## UX

1. In `WorkflowFormDialog`, replace the "Catalogue browser coming soon" rail with a **Browse catalogue** button (visible only for new workflows — editing an existing one shouldn't accidentally swap its `serviceId`).
2. Clicking it opens a new full-screen dialog (`CatalogueBrowserDialog`) overlaying the form.
3. Dialog contents:
   - Header: title "APEx Algorithm Catalogue", subtitle "Browsing ESA-APEx/apex_algorithms @ main", close button.
   - Toolbar: single search box (filters across name + provider + description, case-insensitive substring).
   - Table: sortable columns **Name**, **Provider**, **Description** (truncated with tooltip on hover). Row click selects; double-click or "Use selected" button confirms.
   - Footer: "Cancel" and "Use selected algorithm" (disabled until a row is picked).
   - Loading state: skeleton rows while index loads. Error state: inline message with retry. Empty filter state: "No algorithms match."
4. On confirm: close catalogue dialog, set form fields in `WorkflowFormDialog` (overwriting current values), keep form open so the user can adjust before saving.

## Data flow

- **Index fetch (once per session):** `GET https://api.github.com/repos/ESA-APEx/apex_algorithms/git/trees/main?recursive=1`, filter entries matching `algorithm_catalog/<provider>/<algorithm>/records/<algorithm>.json`.
- **Record fetch (lazy per row, in parallel with a small concurrency cap):** `GET https://raw.githubusercontent.com/ESA-APEx/apex_algorithms/main/<path>` returning the algorithm JSON. We need name + description up front for the table, so we fetch all records once after the index loads (118 files, ~one-time on first open) and hold them in a module-level cache for the session.
- **Provider display name:** derived from the path segment (the 13 provider folder names). Fetching `<provider>/record.json` for pretty titles is a nice-to-have; v1 shows the folder name.
- **Pre-fill mapping** (re-using the analysis from the prior turn):
  - `serviceId` ← `record.id`
  - `serviceProvider` ← provider folder name
  - If `conformsTo` includes `openeo-udp`:
    - `endpoint` ← `links[rel=service].href`
    - `namespace` ← `links[rel=application].href`
    - `application` ← `record.id` (process id)
  - If `conformsTo` includes `ogc-api-processes`:
    - `endpoint` ← base of `links[rel=service].href` (strip trailing `/processes/<id>`)
    - `application` ← last path segment of `links[rel=service].href`
    - `namespace` ← `links[rel=application].href`

## Technical details

- New files:
  - `src/components/config/workflows/dialogs/CatalogueBrowserDialog.tsx` — full-screen dialog UI.
  - `src/lib/catalogue/apexCatalogue.ts` — `fetchIndex()`, `fetchAllRecords()`, `mapRecordToWorkflowFields(record, provider)`, module-level cache.
  - `src/lib/catalogue/types.ts` — `CatalogueEntry { provider, algorithmId, name, description, record }`.
- Edit:
  - `src/components/config/workflows/dialogs/WorkflowFormDialog.tsx` — replace placeholder rail with "Browse catalogue" button (shown when `isNew`); on selection, set `serviceId`, `serviceProvider`, and seed `serviceDetails` into local form state.
- Uses existing shadcn `Dialog`, `Input`, `Table`, `Button`, `Skeleton`, `Tooltip`. No new dependencies.
- Network: unauthenticated GitHub API (60 req/hr/IP) — one tree call + 118 raw file fetches batched with `Promise.all` chunks of 10. Both are static asset hosts, no auth.
- No schema changes, no Zod/type updates needed — we only write to existing `serviceId` / `serviceProvider` / `serviceDetails` fields.

## Out of scope / non-goals

- No persistence of catalogue cache to localStorage (in-memory only).
- No new fields stored on the workflow recording its catalogue origin (can add later).
- No edits to `WorkflowCard`, `WorkflowJsonEditorDialog`, or `useWorkflowActions`.
- The previously-discussed serviceId guard remains a separate piece of work.
