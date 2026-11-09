# Basemap Gallery: coverage filters

## Goal
Help users tell worldwide maps apart from maps that only cover part of the world, and quickly find maps that work at the project's map centre.

## What the user sees
- A new **Coverage** filter row under the category tabs: **All**, **Global**, **Regional**, **National**, plus a **Covers map centre** toggle.
- Each row gets a small coverage badge (Global / Regional / National / Polar).
- Rows that don't cover the map centre show a muted "Outside map centre" note, which explains blank thumbnails.
- For non-global maps, the thumbnail and live preview centre on the map's own area, not the project centre, so they show something.

## How coverage is decided
The registry gives a bounding box for about 776 of its 950 maps.
- **Global:** no bounds, or bounds covering most of the world (more than about 300 degrees of longitude and 140 degrees of latitude).
- **Regional:** a continent or several countries, judged by area (for example, Europe or the Arctic).
- **National:** a small area (roughly one country or less, below an area limit, e.g. Switzerland or Brittany).
- **Polar / special:** bounds given in metres rather than degrees (Esri Arctic/Antarctic). These go under Regional with a "Polar" badge and are never counted as covering the map centre unless the centre is beyond 60 degrees north or south.
- **Covers map centre:** the project centre falls inside the bounds. Global maps always count.

The size limits are rough guesses and will be checked against well-known examples in tests (OpenStreetMap.CH counts as National, Mapnik as Global).

## Technical details
- `src/utils/basemapGallery/xyzServices.ts`: add `bounds` and `coverage: 'Global' | 'Regional' | 'National'` to `GalleryEntry`, plus `isPolar`. Add pure helpers `classifyCoverage(bounds)`, `coversPoint(entry, [lng, lat])` and `entryPreviewCenter(entry, fallback)`. Use the preview centre in `toBaseLayer` for the saved preview tile.
- `BasemapGalleryDialog.tsx`: add a coverage filter and a "Covers map centre" switch to the `visible` filter, show the badge and the outside-centre note, and use `entryPreviewCenter` for the thumbnail and the live map.
- Tests in `xyzServices.test.ts` for the classification, point coverage, the polar case and the preview centre.
- Docs: one short paragraph in `docs/layers/base-layers.md` on the coverage filters.
