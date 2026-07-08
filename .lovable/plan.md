## Goal
Reuse a simple Leaflet-based picker for interactively setting map centre + zoom in two places:
1. **Settings → Map centre at start** (`SettingsTab.tsx`)
2. **Stories → Step → Navigation action → Zoom + center** (`ActionEditors.tsx`, `NavigationEditor`) — only in this "Zoom + center" mode, not the "Fit to layer" mode.

`leaflet`, `react-leaflet@^4.2.1`, `@types/leaflet` are already installed.

## Files

### New: `src/components/config/MapCentrePickerDialog.tsx`
Reusable dialog:
- Props: `open`, `onOpenChange`, `center: [lng, lat]`, `zoom: number`, `onApply(center, zoom)`.
- shadcn `Dialog` wrapping a `react-leaflet` `MapContainer` (OpenStreetMap tiles).
- Marker at current centre; pan/click updates centre, scroll/+- updates zoom (moveend/zoomend sync local state).
- Fixes Leaflet default-marker icon URLs (Vite bundler workaround).
- `useEffect` on `open` initialises local state from props to avoid stale overwrites (per project rule).
- Calls `map.invalidateSize()` after the dialog opens so tiles render at full size.
- Footer: Cancel / Apply — Apply invokes `onApply` and closes.

### Edit: `src/components/config/SettingsTab.tsx`
- Import the new dialog + `Crosshair` icon.
- Add `mapPickerOpen` state.
- Add a "Pick on map" button next to the Latitude/Longitude inputs in the "Map centre at start" row.
- Mount `<MapCentrePickerDialog>`; `onApply` dispatches `UPDATE_MAP_CONSTRAINTS` with `{ center, zoom }` and updates `latitudeInput`, `longitudeInput`, `selectedLocation='custom'`.

### Edit: `src/components/config/storymaps/actions/ActionEditors.tsx` (NavigationEditor)
- Import the dialog + `Crosshair` icon.
- Add `pickerOpen` state.
- Under the existing Zoom / Longitude / Latitude / Duration grid (only when `kind === 'zoom'`), add a "Pick on map" button.
- `onApply(center, zoom)` sets `setLon(center[0])`, `setLat(center[1])`, `setZoom(zoom)` — no dispatch (Navigation editor already commits via its own Save button).

## Non-goals
- No changes to any "Zoom to layer" / "Fit to layer" UI.
- No changes to schemas, types, or config data flow — pure UI additions.
- No new library installs (Leaflet already present).

## Verification
- `tsgo` typecheck after edits.
- Manual: open Settings and a Story step Navigation editor, confirm picker opens, pan/zoom updates values, Apply writes back correctly.
