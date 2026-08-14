# Use official CLMS legend graphics as a fallback

## What the updated catalogue contains

The refreshed `clms-public-layers.json` now carries, at **dataset** level, `style.legendImage`:

```json
"style": {
  "legendImage": {
    "source": "official-clms-cdse-legend",
    "pageUrl": "https://land.copernicus.eu/en/cdse-legends/clms_global_ba_300m_v3_daily.png",
    "imageUrl": "https://land.copernicus.eu/en/cdse-legends/.../image-141-....png",
    "contentType": "image/png"
  }
}
```

19 datasets carry one. Four of those layers (burnt-area `day_of_burn`, LST) have **no**
parsed legend at all, so they currently get no styling suggestion; the rest already resolve
to a colormap or categories.

## Behaviour

Precedence when adding a catalogue layer stays: **categories → named/matched colormap →
official legend image → two-stop gradient**. The image is used only where there is no
straightforward translation, i.e. when the layer has no legend, its legend was suppressed
by `legendDiscovery`, or the only outcome would be the untrustworthy gradient fallback.

When the image is used, the layer's `meta.legend` is set to `{ type: 'image', url }` (the
`imageUrl`), and `meta.units` is still populated from the layer's band units as today.

In the catalogue browser the layer row shows a small thumbnail of the official legend plus
"Official CLMS legend graphic", linking to the `pageUrl`. Where a colormap or categories
were resolved, the existing swatch preview is kept and the graphic is only offered as a
link, not applied.

## Technical changes

1. `src/types/service.ts` — add `CatalogueLegendImage { source?, pageUrl?, imageUrl?, contentType? }`
   and type `legendImage` on `CatalogueDatasetStyle`.
2. `src/utils/catalogueLegend.ts` —
   - add a `LegendImageSuggestion { kind: 'legendImage'; url; pageUrl?; units? }` member of
     `CatalogueStyleSuggestion`;
   - give `layerStyleSuggestion(layer, dataset?)` an optional dataset argument; when the
     legend yields nothing, is suppressed, or would yield a `gradient`, and the dataset has
     a `legendImage.imageUrl`, return the image suggestion instead;
   - extend `describeStyleSuggestion` ("Official legend graphic") and make
     `styleSuggestionPreviewCss` return `transparent` for this kind (the browser renders an
     `<img>` instead).
3. `src/components/layers/components/CatalogueBrowser.tsx` — pass the dataset into
   `layerStyleSuggestion`, render the thumbnail/link, and keep the existing metadata rows.
4. `src/hooks/useLayerOperations.ts` — when the transient `__styleSuggestion` is of kind
   `legendImage`, write `meta.legend = { type: 'image', url }` (only if the layer has no
   categories/colormaps/legend yet) alongside units.
5. Tests in `src/utils/__tests__/catalogueLegend.test.ts`: image used when no legend, when
   suppressed, and in place of a gradient; image **not** used when a colormap or categories
   resolve.
6. Document the fallback in `docs/services/catalogues.md` and rebuild with
   `mkdocs build --strict`.

## Out of scope
- Downloading or re-hosting the legend graphics.
- Parsing values out of the legend images.
