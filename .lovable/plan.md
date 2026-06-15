## Goal

When a workflow is selected from the APEx catalogue, the "Review workflow" modal should display the catalogue-derived fields as read-only values (not editable inputs) and offer two checkboxes that copy the catalogue's description and provider into the workflow's `meta` fields on save.

## Changes

### 1. Pass description + provider through from the catalogue

`src/components/config/workflows/WorkflowsTab.tsx`
- In `handleCatalogueSelect`, also stash the catalogue entry's `description` and `provider` (currently only `serviceId`, `serviceProvider`, `serviceDetails` are seeded). Easiest path: extend `MappedWorkflowFields` (in `src/lib/catalogue/types.ts`) with optional `description` and `providerLabel`, populate them in `mapRecordToWorkflowFields` (`src/lib/catalogue/apexCatalogue.ts`) from `entry.description` and `entry.provider`, and forward them into the prefill object as transient sibling fields (e.g. `_cataloguePrefill: { description, provider }`) so `WorkflowFormDialog` can render and use them without polluting the saved `WorkflowItem`.

### 2. Review-mode (read-only) variant of `WorkflowFormDialog`

`src/components/config/workflows/dialogs/WorkflowFormDialog.tsx`
- Detect "review from catalogue" mode: `isNew && prefill?._cataloguePrefill` (or an explicit `mode="review"` prop — preferred for clarity). Add a new optional prop `cataloguePrefill?: { description?: string; provider?: string }` instead of overloading `prefill`.
- When in review mode:
  - Render Service ID, Service provider, and (if present) Endpoint / Namespace / Application as read-only rows (label + plain text or a disabled, borderless display). No `<Input>` elements.
  - Show the catalogue Description as a read-only multi-line block above the checkboxes.
  - Add two `Checkbox` controls (using `@/components/ui/checkbox`):
    - `Copy description` — default checked when a description is available.
    - `Copy attribution` — default checked when a provider is available.
  - On Save:
    - If `Copy description` is checked → set `next.meta.description = cataloguePrefill.description`.
    - If `Copy attribution` is checked → set `next.meta.attribution = { text: cataloguePrefill.provider, ...(existing url if any) }` (overrides the empty-skeleton seed).
    - Merge into the single `onSave` dispatch (Core memory: single merged dispatch).
  - Keep the existing edit-mode behavior unchanged (editable inputs as today) when not in review mode.

### 3. Wire the new prop in `WorkflowsTab`

- Pass `cataloguePrefill={{ description, provider }}` to the Add/Review `WorkflowFormDialog` instance. Clear it alongside `prefill` when the dialog closes.

## Out of scope

- No change to the Edit Workflow dialog (still fully editable).
- No schema/type changes beyond the two optional fields on `MappedWorkflowFields`. `meta.description` and `meta.attribution.text` already exist in the config schema and are written through the passthrough `meta` on `WorkflowItem`.

## Acceptance

- Selecting an algorithm from the catalogue opens the Review modal with non-editable fields and a visible description block.
- Both checkboxes default to checked when data is available.
- Saving with both checked produces a `WorkflowItem` whose `meta.description` equals the catalogue description and whose `meta.attribution.text` equals the catalogue provider.
- Unchecking either checkbox omits the corresponding meta field from the saved workflow.
