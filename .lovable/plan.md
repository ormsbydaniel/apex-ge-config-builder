# Unify Workflow Cards with Layer Source Cards (Option A)

## Goal

Make workflow cards full peers of layer source cards by reusing the existing `Layer*` display sections — so workflows get description/attribution, data visualisation, legend + units, vector fields, and controls — while keeping the workflow-specific bits (serviceId, serviceProvider, serviceDetails, future catalogue browser) as a distinct shell.

No schema changes — `WorkflowItemSchema` already carries `meta`, `layout`, `data`, etc. via `OptionalSourceShape`.

## What changes

### 1. WorkflowCard becomes an expandable card

`src/components/config/workflows/WorkflowCard.tsx` grows from a one-line summary into an expandable card mirroring `LayerCard`:

- **Header (workflow-specific)**: `serviceId` title, `serviceProvider` badge, endpoint badge, expand/collapse chevron, action buttons (Edit, JSON, Duplicate, Remove, Move Up/Down).
- **Body (shared with layer cards)**, in this order:
    1. `LayerDescriptionAttributionDisplay` — `meta.description`, `meta.attribution`.
    2. `LayerDataVisualisationSection` — categories, colormaps, gradient, RGB, vector styling.
    3. `LayerLegendSection` — legend + units (`meta.n`).
    4. `LayerFieldsDisplay` — vector fields, only if data is a vector format.
    5. `LayerControlsDisplay` — opacity, zoom-to, download, temporal, constraint, blend, timeframe.
- **No Data Sources tabs**: the Datasets / Statistics / Constraints / Charts tabbed block (`LayerCardTabs`) is not rendered on workflow cards. The underlying fields (`data`, `statistics`, `constraints`, `charts`) are left untouched on read/write so we can surface them later without data loss or schema changes.
- **Service section (workflow-specific)**: a collapsible block at the top of the body for `serviceDetails.endpoint` / `namespace` / `application`, editable inline (matching how sources edit inline). The same fields remain editable in the form dialog.

### 2. Adapter at the call site (no refactor of layer components)

The shared `Layer*` components are typed against `DataSource` (which requires `name` and `isActive`). Add a small adapter in `WorkflowCard` that wraps the `WorkflowItem` as a `DataSource`-shaped object for the children, supplying:

- `name` = `workflow.serviceId ?? ''`
- `isActive` = `true` (workflows aren't toggleable in this list)
- `meta` / `layout` / `data` / `timeframe` — passed through unchanged.

Edits coming back from the children write to the workflow via `updateWorkflow(index, nextWorkflow)`. The adapter strips the synthetic `name`/`isActive` on write so we don't pollute the workflow object.

### 3. Empty skeletons on add

`WorkflowFormDialog` "Add Workflow" pre-populates the new workflow with empty `meta` and `layout` skeletons so the shared sections render as collapsed/empty placeholders ready to fill in:

```ts
{
  serviceId, serviceProvider, serviceDetails,
  meta: { attribution: { text: '' } },
  layout: { layerCard: {} },
}
```

`WorkflowFormDialog` itself keeps its current narrow scope (serviceId, provider, description, service details) — ongoing rich editing happens inline on the card, just like sources.

### 4. Hoisted workflows inherit parent meta/layout

Update `src/utils/deprecated/sourceWorkflows/migrate.ts` (`migrateSourceWorkflowsToTopLevel`): when hoisting a per-source `workflows[]` entry to the top level, deep-merge the parent source's `meta` and `layout` into the workflow (workflow's own values win on conflict). Existing top-level workflows are untouched. Add a test covering: hoisted workflow gains parent's description/attribution/legend/units; workflow's own overrides take precedence.

## Files

**Edit**
- `src/components/config/workflows/WorkflowCard.tsx` — expandable layout, adapter, embed shared sections (no `LayerCardTabs`).
- `src/components/config/workflows/WorkflowsTab.tsx` — pass through any new props (e.g. expand state if needed).
- `src/components/config/workflows/dialogs/WorkflowFormDialog.tsx` — pre-populate `meta`/`layout` skeletons on add.
- `src/utils/deprecated/sourceWorkflows/migrate.ts` — inherit parent `meta`/`layout` when hoisting.
- `src/utils/deprecated/sourceWorkflows/__tests__/migrate.test.ts` — new inheritance test.

**No changes**
- Zod schemas / TypeScript interfaces (workflows already accept the full source shape).
- `Layer*` display components (typed against `DataSource`; we adapt at the call site).
- `LayerCardTabs` (untouched; simply not rendered by `WorkflowCard`).
- `ConfigContext`, workflow hooks (`useWorkflowActions`).

## Out of scope

- Refactoring `Layer*` components to a generic `SourceLike` prop type (Option B). Revisit only if the adapter proves painful.
- Embedding a full `LayerCard` inside `WorkflowCard` (Option C). Layer-list concerns (active toggle, base layer, exclusivity, swipe/mirror/spotlight) don't apply.
- Catalogue browser implementation — placeholder rail in `WorkflowFormDialog` stays as-is.
- Datasets / Statistics / Constraints / Charts on workflows. Underlying fields preserved on read/write; UI deferred.
