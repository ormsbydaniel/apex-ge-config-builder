# Basemap Gallery for the Base Layers section

## Goal
A **Browse Basemap Gallery** button in the Base Layers header opens a searchable gallery of ready-made background maps from the open xyzservices registry (CARTO, Esri, OpenStreetMap, OpenTopoMap, USGS, NASA GIBS and more). Picking one or more adds complete base layers — name, tile address, attribution, preview thumbnail and zoom limits filled in — with no typing.

## What the user sees

```text
Base Layers  [Add Recommended] [Browse Basemap Gallery] [Add Base Layer]

+-------------------------------------------------------------------+
| Basemap Gallery                                          [x]       |
| [Search...........]  [ ] Show maps that need an API key            |
| Satellite | Light | Dark | Terrain | Streets | Specialist | All    |
|-------------------------------------------------------------------|
| [thumb] Esri World Imagery      Esri      z0-18   [ ] select       |
| [thumb] CARTO Positron          CARTO     z0-20   [x] select       |
| [thumb] Stadia Alidade Dark     Stadia    KEY     [ ] select       |
|   ...                                                              |
|-------------------------------------------------------------------|
| Preview: small live map of the highlighted basemap at map centre   |
| Attribution: (c) OpenStreetMap contributors (c) CARTO              |
|-------------------------------------------------------------------|
| 2 selected          [ ] Display first selection on load            |
|                                        [Cancel] [Add 2 base maps]  |
+-------------------------------------------------------------------+
```

- **Categories** as tabs, plus free-text search across name and provider.
- **Free maps only by default**; a toggle reveals maps needing an API key, which show a "Key" badge and, when selected, an inline key box (the key is written into the tile address; a warning explains it will be visible in the saved config).
- **Live preview** of the highlighted map (small Leaflet map at the project's map centre, reusing the mini-map from Display Settings).
- **Thumbnail** per row, rendered from a single tile around the map centre (lazy-loaded); this same tile address becomes the base layer's preview image.
- **Already-added** basemaps (same tile address) are marked "Added" and disabled.
- After adding, a toast confirms and the new cards appear in Base Layers; each remains editable in the normal Base Layer form.

## Data source for the gallery
- Fetch `providers.json` from the xyzservices GitHub raw URL at runtime when the gallery first opens, cached in memory for the session (same pattern as recommended base layers). If the fetch fails, show an error with Retry.
- Optional: allow the examples manifest to override the URL (`recommended.basemapRegistry`), so ESA-APEx can host a pinned copy later.
- Flatten providers/variants into gallery entries; skip entries that are clearly not usable: non-`{z}/{x}/{y}` templates, `bounds`-limited regional sets outside the map centre (shown under "Regional" instead), entries with `status: broken`.
- Categories are assigned by a small curated rule table (provider/variant name keywords: Imagery/Satellite -> Satellite; Positron/Light/Gray -> Light; Dark/Matter -> Dark; Topo/Terrain/Relief -> Terrain; Street/Mapnik/Voyager -> Streets; everything else -> Specialist).

## What gets saved per basemap
```json
{
  "name": "CARTO Positron",
  "isBaseLayer": true,
  "isActive": false,
  "preview": "https://a.basemaps.cartocdn.com/light_all/5/15/10.png",
  "meta": { "description": "", "attribution": { "text": "(c) OpenStreetMap contributors (c) CARTO", "url": "https://carto.com/attributions" } },
  "data": [{ "format": "xyz", "url": "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png", "zIndex": 0, "minZoom": 0, "maxZoom": 20 }],
  "exclusivitySets": []
}
```
- Template placeholders resolved: `{s}` -> first subdomain (builder does not rotate subdomains, per XYZ docs), `{r}` -> empty, `{ext}`/`{variant}`/`{format}` and other static variables from the entry, `{apikey}`/`{accessToken}` from the key box.
- Attribution: plain text from `attribution`; URL extracted from the first link in `html_attribution` when present.
- Zoom limits use the existing `minZoom`/`maxZoom` dataset fields (shown in Display Settings).
- "Display first selection on load" sets `isActive` on that one, using the existing single-active rule and confirmation if another base layer is already active.

## Docs
- New section "Basemap Gallery" in `docs/layers/base-layers.md` (button, categories, API keys warning, what is saved, licence note that provider terms still apply).
- Short tip added to Tutorial 2-5 pointing to the gallery as an alternative. No screenshots until the user approves the UI.
- roadmap.md entry.

## Out of scope (later)
- Subdomain rotation, WMTS/WMS entries, retina `{r}` variants, persisting API keys securely.

## Technical details
- `src/utils/basemapGallery/xyzServices.ts`: `fetchXyzProviders()` (session cache, manifest override), `flattenProviders(json) -> GalleryEntry[]`, `resolveTemplate(entry, key?)`, `categorise(entry)`, `parseHtmlAttributionUrl()`, `previewTileUrl(entry, center, zoom)`, `toBaseLayer(entry, opts) -> DataSource`. Pure functions with Vitest tests (flatten, placeholder resolution, key requirement detection, attribution parsing, dedupe by url).
- `src/components/layers/components/BasemapGalleryDialog.tsx`: dialog with search, category tabs, key toggle, virtualised/simple list (~950 entries is fine with lazy thumbnails via `loading="lazy"`), preview using `ZoomPreviewMap` generalised to accept a tile URL, selection state initialised in `useEffect` on `open` (project rule).
- `BaseLayerGroup.tsx`: new button + `onBrowseBasemapGallery` prop; wiring through the same path as `onAddRecommendedBaseLayers` (LayersTabContent / LayersTabCore), adding all selections in a single config update dispatch.
- No schema changes: uses existing DataSource/DataSourceItem fields (`preview`, `meta.attribution`, `minZoom`, `maxZoom`, `format: 'xyz'`). Verify `minZoom`/`maxZoom` survive `useValidatedConfig`.
- AGENTS.md rule: basemap gallery entries are converted in `src/utils/basemapGallery/` only, so gallery and saved layers cannot drift.
