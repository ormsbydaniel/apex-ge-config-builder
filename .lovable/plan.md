

## Edit Service feature

Add a pencil/settings icon next to the delete icon on each service card in `ServicesManager`. Clicking it opens the existing "Add New Service" form pre-filled with that service's values, in **Edit mode**.

### UX

- Each service card shows two ghost icon buttons in the top-right: **Edit** (pencil icon, neutral) and **Delete** (trash, red — unchanged).
- Clicking Edit:
  - Scrolls/expands the form panel (same one used for "Add New Service") at the top of the list.
  - Header changes from "Add New Service" → "Edit Service".
  - Submit button changes from "Add Service" → "Save Changes".
  - Pre-fills: Service Type (locked — see below), URL, Name.
  - Cancel discards changes; Save updates the service in-place.
- The "Add Service" / "Add Recommended Services" buttons in the header are disabled while editing (same as current add-mode behaviour).
- Service Type is **read-only in edit mode**. Changing the type would invalidate `format`, `sourceType`, capability shape, and any layers/sources already referencing the service. If a user really needs a different type, they should delete and re-add. We'll show the type as a disabled `Select` (or plain badge + label) with a small helper note: "Service type cannot be changed. Delete and re-add to switch type."
- The JSON/XML upload type is not offered in edit mode (it's a one-shot import path). If the original service was created via upload, the form still edits name/URL only.
- On Save: dispatch `UPDATE_SERVICE` with `{ id, patch: { name, url } }`. Do **not** re-fetch capabilities automatically — existing capabilities are preserved. (User can open the service in the layer picker to lazily refresh, consistent with the recent lazy-capabilities work.)

### Why pencil, not literal cog

Lucide's `Settings` (cog) icon is widely used for configuration panels. For per-row "edit this item" actions the conventional icon is `Pencil` (or `Edit`). I'll use `Pencil` — clearer affordance, matches the existing edit pattern used on layers/data sources. If you specifically want the gear, swap to `Settings` — one-line change.

### Implementation

**`src/components/ServicesManager.tsx`** — only file touched.

1. Add state: `const [editingServiceId, setEditingServiceId] = useState<string | null>(null);`
2. New handler `handleEditService(service: Service)`:
   - Sets `editingServiceId`, `newServiceName = service.name`, `newServiceUrl = service.url`, `selectedFormat` derived from `service.sourceType`/`service.format` (for display only), `setShowAddForm(true)`.
3. Update `handleAddService` to branch on `editingServiceId`:
   - If editing: call new prop `onUpdateService(id, { name, url })` and reset form.
   - Else: existing add flow.
4. Update `handleCancel` to also clear `editingServiceId`.
5. In the card, add a Pencil button (ghost, neutral muted-foreground hover) before the Trash button:
   ```tsx
   <Button variant="ghost" size="sm" onClick={() => handleEditService(service)}
     className="text-muted-foreground hover:text-foreground"
     title="Edit service">
     <Pencil className="h-4 w-4" />
   </Button>
   ```
6. Form panel:
   - Title becomes `editingServiceId ? 'Edit Service' : 'Add New Service'`.
   - Service Type `<Select disabled={!!editingServiceId}>`; below it, helper text shown only when editing.
   - Hide the `json-upload` SelectItem when editing.
   - Submit button label/disabled flag updated to support edit (URL still required, name optional as today).

**`src/components/config/ServicesTab.tsx`** (or wherever `ServicesManager` is rendered) — pass new `onUpdateService` prop wired to dispatch.

**`src/hooks/useServiceManagement.ts`** — add:
```ts
const updateService = useCallback((id: string, patch: Partial<Service>) => {
  dispatch({ type: 'UPDATE_SERVICE', payload: { id, patch } });
  toast({ title: 'Service Updated', description: `"${patch.name ?? ''}" saved.` });
}, [dispatch, toast]);
```
and return it. The reducer's existing `UPDATE_SERVICE` case already merges correctly.

**`src/contexts/ConfigContext.tsx`** — `UPDATE_SERVICE` currently does not mark the config dirty (intentional for capability writes). Change it to mark dirty **only when the patch contains user-editable fields** (`name` or `url`):
```ts
const isUserEdit = 'name' in patch || 'url' in patch;
return {
  ...state,
  services: updatedServices,
  ...(isUserEdit ? { hasUnsavedChanges: true } : {}),
};
```
This preserves the lazy-capability behaviour while ensuring real edits trigger the unsaved-changes guard.

### Files touched

- `src/components/ServicesManager.tsx` — Pencil button, edit-mode form state, conditional labels.
- `src/hooks/useServiceManagement.ts` — `updateService` action creator.
- `src/contexts/ConfigContext.tsx` — mark dirty when `UPDATE_SERVICE` patches `name`/`url`.
- Caller of `ServicesManager` (likely `src/components/config/ServicesTab.tsx`) — wire `onUpdateService` prop.

### Out of scope

- Changing service type after creation.
- Re-fetching capabilities on URL change (stale capabilities will refresh next time the service is opened in the layer picker; could be a follow-up "Refresh capabilities" button).
- Editing services created from JSON/XML upload beyond name/URL.

