# Selectable Recommended Base Layers

## What changes

Today, **Add Recommended Base Layers** (Layers tab → Base Layers section) fetches the
recommended config and immediately adds *every* base layer it contains. We'll change it
so clicking the button opens a picker modal where the user chooses which base layers to
add, mirroring the existing **Add Recommended Services** dialog.

## Behaviour

- Clicking **Add Recommended Base Layers** still shows "Loading…" while the manifest
  fetch runs, then opens a modal listing the recommended base layers.
- Each row shows the base layer **name** and its service **URL**, with a checkbox.
- All layers are **selected by default**; a **Select All / Deselect All** checkbox in
  the header flips the whole list, and the footer button reads
  `Add N Base Layer(s)` (disabled when none selected).
- Base layers already present in the config (matched by service URL) are excluded from
  the list, so they can't be duplicated.
- Confirming adds only the selected layers, shows the existing success toast, and
  expands the Base Layers group as today. Fetch failures keep the existing error toast.
- If all recommended layers are already in the config, show a toast
  ("All recommended base layers have already been added") instead of an empty modal.

## Technical details

- **New** `src/components/layers/components/RecommendedBaseLayersModal.tsx` — modelled
  directly on `src/components/RecommendedServicesModal.tsx` (same Dialog/Checkbox/
  ScrollArea structure), operating on `DataSource` instead of `Service`. Rows show
  `source.name` and the first data source URL (with `ExternalLink`-style truncation
  conventions already used elsewhere).
- **`src/hooks/useLayerTypeHandlers.ts`** — `handleAddRecommendedBaseLayers` now fetches
  and stores the layers in state plus opens the modal instead of adding directly; a new
  `handleConfirmRecommendedBaseLayers(selected)` callback does the `addLayer` loop,
  toast, and `setExpandedGroupAfterAction('__BASE_LAYERS__')`. Modal open/close state
  lives here alongside the existing `isLoadingRecommended`.
  - Needs the current config's base layers to filter duplicates — the hook already
    receives `addLayer`; it will also receive the config (or a list of existing base
    layer URLs) from its caller so the modal can be given the filtered list.
- **Wiring** (`LayersMainContent.tsx` / wherever `layersLogic` composes
  `useLayerTypeHandlers`) — pass existing base layer URLs in; render the modal next to
  `BaseLayerGroup` usage.
- Follow existing conventions: dialog state initialised from the `open` prop via
  `useEffect` (matches the services modal's reset-on-`services`-change pattern), single
  toast per confirm.

## Out of scope

- No change to the recommended-config fetch/URL resolution logic.
- No change to **Add Recommended Services** or base layer editing/reordering.
