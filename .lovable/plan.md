## Goal

Add **Workflows** as a top-level tab between **Draw Order** and **Services**, backed by the top-level `config.workflows` array as the single source of truth. The page is a flat list of workflows (no groups). Adding/editing uses a modal that is scaffolded to grow into a catalogue browser later.

Per-source `source.workflows` is **deprecated** in this change — the new tab is the only place workflows live.

## Reference shape

From the GE-265 demo config, top-level `workflows[]` entries use:

```
serviceId, serviceProvider, serviceDetails?, meta?, data?
```

`WorkflowItemSchema` already accepts the full source surface, and `configSchema.ts` already declares `workflows: z.array(WorkflowItemSchema).optional()` at the root. No schema changes required.

## Scope of changes

### 1. State plumbing — top-level `workflows`

- `src/types/common.ts` — extend `ExtendedConfigProps` and `ConfigUpdateProps` with optional `workflows: WorkflowItem[]`.
- `src/contexts/ConfigContext.tsx` — include `workflows` in initial state (default `[]`), payload-import branch, and generic `UPDATE_CONFIG` merge.
- `src/hooks/useConfigBuilderState.ts` — expose `addWorkflow`, `updateWorkflow`, `removeWorkflow`, `duplicateWorkflow`, `moveWorkflow`. Each handler dispatches a single `UPDATE_CONFIG` (Core memory: merge updates).
- `src/hooks/useValidatedConfig.ts` / `useConfigSanitization.ts` — confirm top-level workflows survive validation (already pass-through in sanitization).

### 2. New top-level tab

`src/components/ConfigBuilder.tsx`:

- Add `workflows` `TabsTrigger` between Draw Order and Services with the lucide `Workflow` icon.
- Bump `grid-cols-7` to `grid-cols-8`.
- Render `<WorkflowsTab />` in a new `TabsContent value="workflows">`.

### 3. `WorkflowsTab` page (flat list)

New folder `src/components/config/workflows/`:

```
WorkflowsTab.tsx                  // page shell, "Add Workflow" button, flat list
WorkflowCard.tsx                  // single workflow row (title, provider, badges, actions)
WorkflowSummary.tsx               // compact serviceId / provider / description snippet
dialogs/
  AddWorkflowDialog.tsx           // modal form (catalogue-ready shell)
  EditWorkflowDialog.tsx          // same form, prefilled
hooks/
  useWorkflowActions.ts           // add/update/remove/duplicate/move via updateConfig
```

Behaviour:

- Header with "Add Workflow" button and workflow count.
- Flat list of `WorkflowCard`s in `config.workflows` order. No grouping, no expand/collapse.
- Each card shows: serviceId (title), serviceProvider (badge), `meta.description`, actions (edit / duplicate / remove / move up / move down).
- Reuses compact metrics, badge, and move-control styles from the Layers page (`Compact Layout Metrics`, `Subtle Metadata Badges`, `Compact Move Controls` memories).
- Empty state: "No workflows yet" + "Add Workflow" CTA.

### 4. Add / Edit dialog (catalogue-ready shell)

`AddWorkflowDialog.tsx`:

- Left rail: placeholder for the future catalogue list — empty state "Catalogue browser coming soon".
- Right pane: structured form with `serviceId` (required), `serviceProvider` (select from `config.services` providers, free-text fallback), `serviceDetails` (collapsible: `endpoint`, `namespace`, `application`), `meta.description` (textarea).
- Footer: Cancel / Save. Save calls `addWorkflow` or `updateWorkflow`.
- Form state initialised inside `useEffect` on `open` (Core memory). Single `onSave` dispatch (Core memory).

`EditWorkflowDialog` reuses the same form body, omits the catalogue rail.

### 5. Deprecation of `source.workflows`

Per `Refactoring Philosophy` and Core memory ("Deprecate to `src/utils/deprecated/` with README and `@deprecated` rather than deleting code"):

- Add `@deprecated` JSDoc on `BaseDataSource.workflows` (`src/types/layer.ts`) and `WorkflowItem` references inside source-shaped contexts where appropriate, pointing readers at top-level `config.workflows`.
- Leave the field readable so existing configs still parse. The Layer Card no longer surfaces workflows (any Workflows tab / Workflows section inside the layer card is removed).
- Add `src/utils/deprecated/sourceWorkflows/README.md` documenting:
  - Why the field is deprecated (single top-level collection).
  - That round-trip / import code still passes the field through unchanged.
  - A one-time migration helper `migrateSourceWorkflowsToTopLevel(config)` that moves any `source.workflows[]` entries into `config.workflows[]` and clears them on the source. The helper is **not** auto-applied; it lives next to the README for users who want to upgrade old configs manually (e.g. via the JSON Config tab).
- Remove per-source workflow UI affordances only — keep the schema field optional and pass-through so existing JSON loads without errors.
- Existing tests covering per-source workflow round-trip stay in place to prove the field still survives import/export untouched.

### 6. Export / round-trip

`useConfigExport.ts` already serialises top-level `config.workflows` and per-source `source.workflows`. Both stay. Re-run `configRoundTrip.workflows.test.ts` against the new top-level actions.

### 7. Tests

- `useWorkflowActions.test.ts` — add/update/remove/duplicate/move on top-level workflows produce expected arrays.
- `WorkflowsTab.test.tsx` — renders flat list, empty state, "Add Workflow" opens dialog, edit flow updates state.
- `migrateSourceWorkflowsToTopLevel.test.ts` — helper hoists per-source workflows into the top-level array and clears the source field; no-ops when nothing to move.
- Existing per-source round-trip tests remain green.

## Explicitly out of scope

- Workflow groups (flat list only for now).
- Catalogue browser implementation (placeholder rail only; tracked as follow-up).
- Auto-migration of existing per-source workflows on config load (manual helper only).
- Removing the per-source `workflows` field from the schema (deprecated, kept for backward compatibility).
- Editing workflow `data[]` / `statistics[]` / `charts[]` from the new page (raw JSON / future passes).

## Risks

- `ExtendedConfigProps` is consumed in many hooks — additions stay optional in `ConfigUpdateProps` to avoid touching unrelated callers.
- `grid-cols-7 → grid-cols-8` shrinks tabs slightly; verify the bar fits at the smallest supported width.
- Users with existing per-source workflows will not see them on the new Workflows tab until they run the migration helper. The deprecation README must call this out clearly.
