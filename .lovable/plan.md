
# Round-trip workflows through import/export + remove legacy workflow code & UI

## Goal

1. Import and export configs whose `sources[].workflows[]` entries carry the full source surface (`meta`, `data`, `statistics`, `serviceDetails`, etc.) without losing or polluting fields.
2. Strip the obsolete legacy workflow shape (`{ zIndex, service, label }`) from the schema, types, and validation pipeline.
3. Delete the existing Workflows tab + editor dialog wholesale — they're tied to the old shape and a fresh UI will be designed separately.

## Changes

### 1. Schema — drop legacy fields (`src/schemas/configSchema.ts`)

In `WorkflowItemSchema`, remove:

```ts
zIndex: z.number().optional(),
service: z.string().optional(),
label: z.string().optional(),
```

Keep `.passthrough()` so old configs that still contain those keys still load (they're preserved but undocumented), but they're no longer part of the schema, types, or UI contract.

### 2. Types — drop legacy fields (`src/types/dataSource.ts`)

In `WorkflowItem`, remove `zIndex?`, `service?`, `label?`. `serviceId`, `serviceProvider`, `serviceDetails`, plus `[key: string]: any` remain.

### 3. Validation pipeline — pass workflows through unchanged (`src/hooks/useValidatedConfig.ts`)

Replace lines 62-68 with:

```ts
const validatedWorkflows = source.workflows?.map(workflow => ({ ...workflow }));
```

No more injecting `zIndex: 10`, `service: ''`, `label: ''`.

### 4. Delete the existing workflow UI entirely

**Files to delete:**
- `src/components/layers/components/WorkflowsTab.tsx`
- `src/components/layers/components/WorkflowEditorDialog.tsx`

**`src/components/layers/components/LayerCardTabs.tsx` — strip all workflow wiring:**
- Remove imports of `WorkflowsTab`, `WorkflowEditorDialog`, `WorkflowItem`.
- Remove props: `onAddWorkflow`, `onRemoveWorkflow`, `onUpdateWorkflow`, `onMoveWorkflowUp/Down/ToTop/ToBottom`.
- Remove state: `workflowDialogOpen`, `editingWorkflowIndex`, `workflowsCount`.
- Remove the `<TabsTrigger value="workflows">` and the `<TabsContent value="workflows">` block.
- Remove the `<WorkflowEditorDialog .../>` render at the bottom.

**Cascade through callers** (each loses the same workflow prop set and any local handler wiring):
- `src/components/layers/LayerCard.tsx`
- `src/components/layers/LayersTabContainer.tsx`
- `src/components/layers/components/SubInterfaceGroup.tsx`
- `src/components/layers/components/LayerCardContent.tsx`
- `src/components/layers/components/SortableLayerCard.tsx`
- `src/components/layers/components/LayerGroup.tsx`
- `src/hooks/useLayersTabComposition.ts`
- `src/contexts/LayersTabContext.tsx`

**`src/utils/layerActions.ts`** — delete the workflow action helpers (`addWorkflow`, `removeWorkflow`, `updateWorkflow`, `moveWorkflowUp/Down/ToTop/ToBottom`) and update `src/utils/__tests__/layerActions.test.ts` to remove the corresponding test suites.

**`src/hooks/__tests__/useLayerCardFormSubmission.test.ts`** — drop any workflow-prop assertions still referencing the old shape.

**Data preservation:** `source.workflows` on existing configs is left intact end-to-end (schema accepts it, validation passes it through, export serialises it via the existing `...source` spread + `orderSourceProperties`). Users simply lose the UI to edit it until the new tab ships.

### 5. Export path — sanitise URLs nested inside workflow data/statistics (`src/hooks/useConfigExport.ts`)

In the `config.sources.map(...)` block, after the existing `constraints` handling, add:

```ts
...(source.workflows && {
  workflows: source.workflows.map(wf => ({
    ...wf,
    ...(Array.isArray(wf.data) && {
      data: wf.data.map((item: any) => ({
        ...item,
        url: item.url ? sanitizeUrl(item.url) : item.url,
      })),
    }),
    ...(Array.isArray(wf.statistics) && {
      statistics: wf.statistics.map((item: any) => ({
        ...item,
        url: item.url ? sanitizeUrl(item.url) : item.url,
      })),
    }),
  })),
}),
```

`configSorting.orderSourceProperties` already lists `workflows` in the export order and preserves unknown nested fields via its catch-all.

### 6. Tests

- Update `src/schemas/__tests__/workflowItemSchema.test.ts`: drop legacy-fields-as-contract; instead assert passthrough still tolerates them for back-compat.
- Add `src/hooks/__tests__/configRoundTrip.workflows.test.ts`:
  - Commit user's sample as `src/__fixtures__/config_workflow_execution.json`.
  - Parse with `ConfigurationSchema` → assert success, Shape A keeps `meta`/`data`, Shape B keeps `serviceDetails`.
  - Rebuild the export object the same way `useConfigExport` does → JSON.stringify → JSON.parse → re-validate → assert deep-equal on each workflow entry.

## Out of scope

- The replacement Workflows tab UI (clean-sheet design, separate task).
- Recursing import transformations into `workflows[].data`.
- Capabilities fetching for URLs nested inside a workflow.
- Auto-migrating legacy `{ zIndex, service, label }` entries — passthrough keeps them loadable; they're effectively orphaned data until the user clears them.
