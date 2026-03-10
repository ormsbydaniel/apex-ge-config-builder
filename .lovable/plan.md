

## Problem Analysis

After adding a layer that belongs to a sub-interface group, the user is not returned to the correct expansion state. Two root causes:

### Issue 1: Sub-group not expanded after layer creation/edit
In `LayersTabCore.handleLayerSaved` (line 117-124), the `groupName` is set to just the interface group name (e.g. `"MyGroup"`). But `LayerHierarchy`'s expansion effect (line 464-489) only expands a sub-group if the key contains `"::"` (e.g. `"MyGroup::MySubGroup"`). So the parent group opens, but the sub-group stays collapsed.

Same issue in `handleLayerFormCancel` (lines 72-79).

### Issue 2: Sub-group expansion state not persisted in navigation state
- `NavigationState` (in `useNavigationState.ts`) has no `expandedSubGroups` field
- `handleExpansionStateChange` in `ConfigBuilder.tsx` only accepts `(layers, groups)` — the third `subGroups` argument from `LayerHierarchy` is silently dropped
- Intermediate component prop types (`LayersMainContent`, `LayersTabContent`) don't include `expandedSubGroups` in their `navigationState` type

This means when switching tabs or navigating to preview and back, sub-group expansion state is lost.

---

## Plan

### 1. Add `expandedSubGroups` to `NavigationState` (`src/hooks/useNavigationState.ts`)
- Add `expandedSubGroups: string[]` to the `NavigationState` interface and `defaultState`
- Add `setExpandedSubGroups` setter callback

### 2. Update `ConfigBuilder.tsx` expansion state handler
- Accept third `subGroups` parameter in `handleExpansionStateChange`
- Call new `setExpandedSubGroups` with it

### 3. Fix group name to include sub-group in `LayersTabCore.tsx`
- In `handleLayerSaved` (new layer path): if `layer.layout?.subinterfaceGroup`, set `groupName` to `"interfaceGroup::subinterfaceGroup"`
- In `handleLayerFormCancel`: same fix for the editing layer
- In `handleLayerSaved` (edit path): same fix

### 4. Thread `expandedSubGroups` through intermediate prop types
- `LayersMainContent.tsx`: add `expandedSubGroups?: string[]` to `navigationState` prop type
- `LayersTabContent.tsx`: same
- `LayersTabCore.tsx`: same (already has `expandedSubGroups` in the `navigationState` type passed to `LayerHierarchy`, but the intermediaries strip it)

### 5. Pass `expandedSubGroups` from ConfigBuilder down
- In `ConfigBuilder.tsx`, include `expandedSubGroups` in the `navigationState` object passed to `LayersTab`

