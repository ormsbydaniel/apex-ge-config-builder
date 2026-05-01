## Goal
In the Healthcheck "View details" expanded row, add **Remove Layer** and **Edit Layer** action buttons placed **above** the URL Validation Details card (full-width row), aligned with the "URL Validation Details" header level. Keep the details card at its current width.

## Behaviour

### Remove Layer
- Destructive button (`text-red-600`, `Trash2` icon, outline variant).
- On click → `AlertDialog` confirmation:
  - Title: "Remove layer?"
  - Body: `This will remove "<layer name>" entirely from this config.`
  - Cancel + Confirm buttons; confirm uses destructive styling.
- On confirm → dispatch `REMOVE_SOURCE` (payload: source index) and collapse the expanded row. Modal stays open so user can continue triaging other layers.

### Edit Layer
- Standard button (`Edit` icon, outline variant).
- On click → close the Healthcheck modal, switch to the **Layers** tab, scroll to + expand that layer's card. No edit form is opened.

## Changes

### 1. `src/components/config/CompleteLayersDialog.tsx`
- Extend `CompleteLayersDialogProps`:
  - `onRemoveLayer?: (sourceIndex: number) => void`
  - `onEditLayer?: (sourceIndex: number) => void`
- Inside the expanded `<TableRow>`'s cell, restructure to two stacked sections:
  1. **Actions row** (new): a small flex header at top — left side blank / spacing, right side the two buttons (`Remove Layer`, `Edit Layer`). Only renders if at least one callback is supplied.
  2. **URL Validation Details** card (existing): unchanged width and content.
- Add `AlertDialog` state `confirmRemoveLayer: { index: number; name: string } | null` to back the confirmation.
- After confirm, call `onRemoveLayer(idx)`, clear the expanded row, and close the alert.
- Edit handler: call `onEditLayer(idx)` then `onOpenChange(false)`.

### 2. `src/components/config/HomeTab.tsx`
- Add optional prop `onNavigateToLayer?: (sourceIndex: number) => void` on `HomeTabProps`.
- Pass to `<CompleteLayersDialog>`:
  - `onRemoveLayer={(idx) => dispatch({ type: 'REMOVE_SOURCE', payload: idx })}`
  - `onEditLayer={(idx) => onNavigateToLayer?.(idx)}`

### 3. `src/components/ConfigBuilder.tsx`
- Wire `<HomeTab onNavigateToLayer={...} />`:
  - Use existing `setActiveTab('layers')` to switch tabs.
  - Use existing `useScrollToLayer` hook to scroll to the layer card.
  - Use existing `setExpandedLayers([...])` from `useNavigationState` to expand the target layer card by ID.

## Technical notes
- `REMOVE_SOURCE` action already exists in `ConfigContext` (line 38) and removes by source index.
- Layer cards in `LayersTab` already support being expanded via the `expandedLayers` array in `useNavigationState`. We pass the layer's stable card ID (derived from its source index) into that array.
- `useScrollToLayer.scrollToLayer(idx)` already includes a 150ms `setTimeout` to allow the tab/DOM to settle, so no extra coordination required.
- AlertDialog uses the existing `@/components/ui/alert-dialog` primitives (already imported elsewhere in `HomeTab`, will be added to `CompleteLayersDialog` imports).

## Files to edit
- `src/components/config/CompleteLayersDialog.tsx`
- `src/components/config/HomeTab.tsx`
- `src/components/ConfigBuilder.tsx`
