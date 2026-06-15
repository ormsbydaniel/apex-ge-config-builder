## Goal

1. Resize the APEx catalogue browser modal from full-screen to 80% width / 80% height (consistent with other dialogs in the app).
2. Reorder the "Add Workflow" flow so the catalogue browser opens first, and the existing `WorkflowFormDialog` becomes a pre-filled "review & save" step.

## Changes

### `CatalogueBrowserDialog.tsx`
- Replace the full-screen `DialogContent` sizing (`max-w-[100vw] w-screen h-screen sm:rounded-none`) with `w-[80vw] max-w-[80vw] h-[80vh] max-h-[80vh]`.
- Keep internal flex column layout, sticky header/footer, and scrollable table region unchanged.

### `WorkflowsTab.tsx`
- Add new state `catalogueOpen` and `prefill: WorkflowItem | null`.
- "Add Workflow" button now sets `catalogueOpen = true` (no longer opens `addOpen` directly).
- Render `<CatalogueBrowserDialog>` at the tab level.
  - On select: map fields → build a partial `WorkflowItem` (`serviceId`, `serviceProvider`, `serviceDetails`), store in `prefill`, close catalogue, open `addOpen`.
  - On cancel/close: just close the catalogue (no review dialog opens).
- Add a small secondary "Add blank" affordance (a "Skip catalogue" link inside the catalogue footer, OR a dropdown beside "Add Workflow") so users can still create a workflow without browsing. Simplest: add a "Skip — create blank" ghost button in the catalogue dialog footer that opens the review dialog with an empty prefill.
- Pass `prefill` into the add `WorkflowFormDialog` via a new prop (see below). Clear `prefill` when the dialog closes.

### `WorkflowFormDialog.tsx`
- Add optional prop `prefill?: Partial<WorkflowItem> | null` used only when `initial` is null (add mode).
- In the `useEffect([open, initial])` initializer, when `initial` is null and `prefill` is provided, seed the local field state from `prefill` instead of blank.
- Remove the in-form "Browse catalogue" rail + the embedded `<CatalogueBrowserDialog>` and the `showCatalogueRail` prop usage (browser now lives at the tab level). The dialog title for add mode reads "Review workflow" (caller-controlled via existing `title` prop — `WorkflowsTab` will pass `"Review workflow"` for the add case, `"Edit Workflow"` unchanged).
- Keep all existing save logic (skeleton meta/layout for new workflows, single merged dispatch) untouched.

### Flow summary

```text
Add Workflow button
   │
   ▼
CatalogueBrowserDialog (80vw × 80vh)
   ├── Use selected → prefill state → Review (WorkflowFormDialog, add mode)
   ├── Skip — create blank → Review (WorkflowFormDialog, add mode, blank)
   └── Cancel → nothing
```

Edit flow (`onEdit` on a card) is unchanged: opens `WorkflowFormDialog` directly with `initial` populated and no catalogue rail.

## Out of scope
- No changes to `WorkflowCard`, `WorkflowJsonEditorDialog`, schemas, types, or `apexCatalogue.ts` data layer.
- No persistence/caching changes.
- No new catalogue features (thumbnails, facets, etc.).
