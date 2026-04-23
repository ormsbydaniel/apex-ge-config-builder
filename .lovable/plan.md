
## Move both Add and Edit Service into a single modal

### Behaviour

Replace the inline "Add New Service" card with a modal dialog that handles both Add and Edit flows. The toolbar **Add Service** button opens the modal in add mode; the pencil icon on any service card opens it in edit mode. One form, one code path, one set of fields.

**Add mode**
- Title: **Add Service**
- Description: "Configure a new map service to add to your collection."
- Service Type selector is **enabled** (user picks STAC, OGC, S3, or one of the file formats).
- URL and Name fields editable.
- Footer: **Cancel**, **Add Service**.

**Edit mode**
- Title: **Edit Service**
- Description: "Update the name or URL for this service. Service type cannot be changed."
- Service Type selector is **disabled** (locked to current type).
- URL and Name fields editable.
- Footer: **Cancel**, **Save Changes**.

Closing via X, Esc, or overlay click behaves like Cancel (discards changes, clears state).

### UI sketch

```text
┌─ Add Service ─────────────────────── x ┐    ┌─ Edit Service ────────────────────── x ┐
│ Configure a new map service…           │    │ Update the name or URL…                │
│                                        │    │                                        │
│ Service Type                           │    │ Service Type                           │
│ [ Choose a format          ▼ ]         │    │ [ STAC                     ▼ ] (lock)  │
│                                        │    │ Service type cannot be changed.        │
│ Service URL                            │    │                                        │
│ [ https://...                       ]  │    │ Service URL                            │
│                                        │    │ [ https://...                       ]  │
│ Service Name                           │    │                                        │
│ [ My catalogue                      ]  │    │ Service Name                           │
│                                        │    │ [ My catalogue                      ]  │
│             [ Cancel ] [ Add Service ] │    │           [ Cancel ] [ Save Changes ]  │
└────────────────────────────────────────┘    └────────────────────────────────────────┘
```

### Implementation

**Single file: `src/components/ServicesManager.tsx`.**

1. **Drop `showAddForm` state.** Replace it with a derived `isFormModalOpen = showAddForm || editingServiceId !== null`, OR keep a single `isFormModalOpen` boolean controlled directly. Simpler: keep `showAddForm` renamed conceptually as "modal open for add"; expose `const isFormModalOpen = showAddForm || editingServiceId !== null`; mode is derived from `editingServiceId !== null`.

2. **Toolbar "Add Service" button** — `onClick` sets `showAddForm = true` (no inline render side effects).

3. **`handleEditService`** — already sets `editingServiceId` plus prefills name/url/format. Remove the `setShowAddForm(true)` line; the modal opens because `editingServiceId !== null`.

4. **`handleAddService`** — unchanged logic (already branches on `editingServiceId` for patch vs add). On success, clear `editingServiceId`, `showAddForm`, and the field state.

5. **`handleCancel`** — clear `editingServiceId`, `showAddForm`, `newServiceName`, `newServiceUrl`, `selectedFormat`. Used by Cancel button and dialog `onOpenChange(false)`.

6. **Delete the inline "Add New Service" card** (the existing block that renders when `showAddForm` is true). Move its three form fields verbatim into a new `<Dialog>`:
   - `open={isFormModalOpen}`, `onOpenChange={(o) => { if (!o) handleCancel(); }}`.
   - `DialogContent` (`max-w-2xl`).
   - `DialogHeader` with title/description switching on `editingServiceId`.
   - Body: `FormatSelector` (with `disabled={editingServiceId !== null}`), URL input, Name input — same components/handlers used today.
   - `DialogFooter`: Cancel + primary button (label switches: **Add Service** vs **Save Changes**).

7. **Imports** — add `Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter` from `@/components/ui/dialog`.

### Notes

- The file-upload "Add via JSON/XML" flow stays exactly as-is — it already runs through `ServiceUploadConfirmDialog` and is unrelated to this form.
- `RecommendedServicesModal` is unchanged.
- Validation/revalidation on URL change still flows through `useBulkServiceValidation` after `onUpdateService` / `onAddService`.

### Out of scope

- Changing which fields are editable.
- Restyling the cards or toolbar.
- Splitting Add and Edit into two separate dialog components — one shared dialog with mode-driven labels keeps the JSX single-sourced.
