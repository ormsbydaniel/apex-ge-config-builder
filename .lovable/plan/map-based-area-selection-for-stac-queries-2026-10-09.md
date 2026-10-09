# Map-based area selection for STAC queries

## Goal
Let users draw the area for a STAC query on a small map instead of typing four numbers, and explain how this relates to the "geometry" queryable.

## What the user sees
**Bbox filter dialog**
- The existing "+ Add bbox filter" dialog gets a small map (about 360px tall) above the West/South/East/North boxes.
- Drag on the map (hold the mouse and drag) to draw a rectangle; the four boxes fill in straight away.
- Typing in the boxes updates the rectangle on the map, so the two always match.
- The map zooms to an existing bbox when you edit one, and otherwise shows the whole world.
- A "Use current map view" button sets the bbox to whatever area is visible.
- A "Clear" button removes the rectangle.
- Saving works exactly as it does today: only `bbox=W,S,E,N` is written into the dataset's web address.

**"geometry" queryables (e.g. eoresults.esa.int)**
- The "geometry" property is the item's footprint. It is the same thing the bbox filter already tests, so a rectangle drawn with the map covers most needs.
- The property filter dialog keeps hiding geometry properties. A short note in the Queryables tab and next to the bbox action will say: "Spatial filtering on geometry uses the bbox filter."
- Polygon drawing (filters like `S_INTERSECTS(geometry, POLYGON(...))`) is left for later, because few servers support CQL2 spatial filters on the items address.

## Technical details
- New `StacBboxMap.tsx` in `src/components/layers/components/`. It uses `react-leaflet`, which is already installed, and the same pattern as `MapCentrePickerDialog` (OSM tiles, `invalidateSize` once the dialog opens).
- Rectangle drawing is written by hand with Leaflet mouse events (Shift-free drag mode that turns off map panning while drawing), so no new drawing library is needed. The rectangle is shown with `L.Rectangle`.
- Props: `value: string[]` (the four box values) and `onChange(next: string[])`. Coordinates are rounded to 4 decimal places, longitudes are kept to -180..180 and latitudes to -90..90, and the existing `validateBbox` still checks the boxes.
- `StacQueryEditor.tsx` puts the map inside the existing bbox dialog. The dialog is widened to `max-w-2xl`. No change to save logic, `stacQuery.ts` or the saved configuration (the AGENTS.md rule that the address is the only stored query still holds).
- Notes added to the Queryables tab (`StacMetadataDialog`) for geometry-type entries.
- Docs: a short paragraph in `docs/data-sources/stac-browser.md`.
- Tests: unit test for the pure helper that converts between a rectangle and the four values (rounding, clamping, west/east order after a right-to-left drag). Checking it in the preview is left to you.

## Not included
Polygon drawing, CQL2 spatial predicates, bboxes that cross the antimeridian.
