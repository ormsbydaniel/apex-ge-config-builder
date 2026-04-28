
# Add "Import Layer Card" option to the Add Layer screen

Narrowly scoped change: add a second card titled **"Import Layer Card"** alongside the existing **"Layer Card"** on the *Add Layer to \<interface group\>* screen. Wire its click up to a stub handler that shows a "Coming soon" toast. Base Layer card stays hidden in the interface-group context. The donor-config picker, layer tree, and import logic are intentionally **deferred** to a follow-up plan.

## What the user sees

On the *Add Layer to \<interface group\>* screen (entered from `+ Add Layer` on any Interface Group or Sub-interface Group):

```text
┌──────────────────────────┐  ┌──────────────────────────┐
│  Layer Card              │  │  Import Layer Card       │
│  A configurable layer…   │  │  Pick one or more Layer  │
│                          │  │  Cards from another      │
│                          │  │  configuration and add   │
│                          │  │  them to this group.     │
│  [ Add Layer Card ]      │  │  [ Import Layer Card ]   │
└──────────────────────────┘  └──────────────────────────┘
```

- "Add Layer Card" → existing flow, unchanged (opens the layer edit form).
- "Import Layer Card" → toast: *"Import Layer Card — coming soon. Donor config picker not yet implemented."*
- Base Layer card remains hidden when entered from an interface group (unchanged behaviour).
- The "no group" path (Layer Card + Base Layer) is unchanged — Import is interface-group-context only.

## Files changed

1. **`src/components/layer/LayerTypeSelector.tsx`**
   - Add optional prop `onImportLayer?: () => void`.
   - When `isFromInterfaceGroup`, switch grid from `md:grid-cols-1` to `md:grid-cols-2`.
   - Render new card next to "Layer Card" using the `Download` icon from `lucide-react`. Card click and button click both call `onImportLayer?.()`.
   - Card styling matches the existing one (same `Card`, `CardHeader`, `CardContent`, hover treatment, semantic tokens — no hard-coded colours).

2. **`src/components/layer/LayerFormContainer.tsx`**
   - Add optional prop `onImportLayer?: () => void`, forward it to `<LayerTypeSelector>`.

3. **`src/components/layers/LayerFormHandler.tsx`**
   - Add optional prop `onImportLayer?: () => void`, forward to `<LayerFormContainer>`.

4. **`src/components/layers/LayersTabCore.tsx`**
   - Add optional prop `onImportLayer?: () => void`, forward to `<LayerFormHandler>`.

5. **`src/components/layers/LayersTabContainer.tsx`**
   - Add optional prop `onImportLayer?: () => void`, forward to `<LayersTabCore>`.

6. **`src/components/layers/LayersTab.tsx`** and **`src/components/config/LayersTab.tsx`**
   - Add optional prop `onImportLayer?: () => void`, forwarded through.

7. **`src/hooks/useLayerOperations.ts`**
   - Add `handleImportLayer = useCallback(() => { toast({ title: 'Import Layer Card', description: 'Coming soon — donor config picker not yet implemented.' }); }, [toast])`.
   - Export it from the hook result alongside `handleLayerTypeSelect`.

8. **`src/components/ConfigBuilder.tsx`**
   - Pull `handleImportLayer` from `useConfigBuilderState` (which re-exports from `useLayerOperations`).
   - Pass it as `onImportLayer={handleImportLayer}` to `<LayersTab>`.

## Technical notes

- **Do not extend `LayerType`.** Import is an action on the Add Layer screen, not a kind of layer. Keep the `LayerType` union (`'layerCard' | 'base'`) untouched and route the import through a separate `onImportLayer` prop end-to-end.
- **No schema or type changes.** No edits to `configSchema.ts`, `types/config.ts`, or `useValidatedConfig.ts` — this is pure UI + prop plumbing.
- **Toast:** use the existing `useToast` hook already imported in `useLayerOperations.ts` (no new dependency).
- **Memory:** no `mem://` entry yet — a stubbed entry point isn't a stable feature worth memorising. Add the memory in the follow-up plan when the actual import flow lands.
- **`useConfigBuilderState`:** verify it re-exports `handleImportLayer`; if it doesn't pass through automatically, add it to the return shape there too. (Will confirm during implementation.)

## Verification

- From the Layers page → click `+ Add Layer` on any Interface Group → confirm two cards appear side-by-side, no Base Layer card.
- Same from a Sub-interface Group → same two cards appear.
- Click **Add Layer Card** → existing flow still works (opens layer edit form).
- Click **Import Layer Card** → toast appears, no navigation, no layer added.
- Confirm the rare "no group" entry path (if reachable) still shows Layer Card + Base Layer with no Import card.
- No TypeScript errors; no console warnings.

After approval, the follow-up plan covers the donor-config picker, the layer tree with multi-select, and insertion logic including ID reminting and dependency handling (services, colormaps, categories).
