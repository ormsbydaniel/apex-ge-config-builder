Update the existing OSM iframe preview in the story navigation settings so it remains interactive for browsing, but clearly communicates that the centre point is what drives the Lon/Lat/Zoom inputs, and adds a way to copy the current map view back into those inputs.

## Scope
- Only affects the navigation action editor in `src/components/config/storymaps/actions/ActionEditors.tsx`.
- Only renders when the action type is "Zoom + center".
- No new runtime dependencies.

## Changes
1. **Remove the marker from the embed URL** so the OSM iframe no longer shows a misleading pinned location icon.
2. **Add a fixed centre crosshair overlay** on top of the iframe. The crosshair stays at the visual centre of the map frame, indicating that the centre of the current view is the value being configured.
3. **Add a "Use current view" button** below the map. Clicking it reads the current map centre and zoom from the OSM iframe URL (`bbox` and `layer` parameters, or from the iframe's `src` query string) and writes them back into the Longitude, Latitude, and Zoom inputs. If the URL does not contain readable values, the button is disabled or shows a short "Zoom/pan the map, then click here" hint.
4. **Keep the existing 250ms debounced preview state** so the live preview still reflects the input values as the user types.
5. **Visual polish**: rounded border, subtle crosshair lines (e.g. 1px primary/foreground with a small central dot), and compact button styling consistent with the existing panel.

## Out of scope
- Two-way live sync while dragging (not possible with the OSM embed without switching to a real mapping library).
- Replacing the iframe with Leaflet or another library.
- Changing the navigation modal layout or other story action types.

## Acceptance
- The map preview no longer displays a static location marker.
- A crosshair is visibly centred on the map frame.
- The user can pan/zoom the map, then click "Use current view" to update the Lon/Lat/Zoom inputs.
- The preview still updates when the user edits the inputs directly.