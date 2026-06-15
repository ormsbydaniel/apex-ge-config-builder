## Goal

Make the "Service details" section of the workflow card visually consistent with sibling sections like "Description & Attribution" — always expanded, left-aligned, plain grey property list, with a small pencil that opens the existing edit modal.

## Changes (single file: `src/components/config/workflows/WorkflowCard.tsx`)

1. **Remove the inner `Collapsible`** wrapping Service details (and drop `serviceOpen` state). Also remove the now-unused `Label` and the inline `Input` editors for endpoint / namespace / application, and the `updateServiceDetails` helper.

2. **Render Service details as a static section** matching `LayerDescriptionAttributionDisplay`'s layout:
   - Header row: `Server` icon + `<h4 className="text-sm font-medium">Service Details</h4>` + ghost pencil button (`h-6 w-6`, `Pencil h-3.5 w-3.5`) that calls the existing `onEdit` prop (same modal as the header pencil — the WorkflowFormDialog already contains the endpoint / namespace / application fields).
   - Body: `<div className="text-xs text-muted-foreground space-y-1 ml-6">` listing only the properties that have values, in the form:
     - `Endpoint: https://...`
     - `Namespace: ...`
     - `Application: ...`
     Each label rendered as `<span className="font-medium">Endpoint:</span>` (matching the "Attribution:" style in the description section).
   - If none are set, show `No service details configured` placeholder (matching sibling empty-state).

3. **Keep the header endpoint host badge** as-is (still useful at-a-glance summary).

4. Section ordering inside `CardContent` stays the same: Service details first, then Description & Attribution, Data Visualisation, Legend, Fields, Controls.

## Out of scope

- No changes to WorkflowFormDialog itself — the existing header pencil modal already edits these fields and will be reused.
- No changes to layer cards or shared components.
