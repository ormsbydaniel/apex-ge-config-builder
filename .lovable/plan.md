## Add a JSON schema reference page to the docs

Add a single new page that documents the underlying JSON structure of an APEx GE Configuration, derived from `src/schemas/configSchema.ts`, with concrete excerpts pulled from `public/examples/test-config.json` (the **Comprehensive demo**) for every section.

### New page

`docs/reference/json-schema.md` — titled **JSON schema reference**.

Add to `mkdocs.yml` under the existing **Reference** group, immediately after **URL parameters**:

```yaml
- Reference:
    - URL parameters: reference/url-parameters.md
    - JSON schema reference: reference/json-schema.md
    - ...
```

### Page structure

Each section follows the same pattern:

1. Short prose describing the object's purpose (1–3 sentences, drawing on existing tab docs where helpful).
2. A field table: **Field · Type · Required · Notes** — derived directly from the Zod schema.
3. A fenced ```json block showing a real excerpt from `test-config.json`, trimmed to ~10–25 lines.
4. Cross-links to the relevant tab docs (e.g. Layers, Services, Settings) for the UI side.

### Sections (matches Zod `ConfigurationSchema` top-down)

1. **Top-level config** — `version`, `exportPrefix`, `layout`, `interfaceGroups`, `exclusivitySets`, `services`, `sources`, `mapConstraints`, `projections`. Show a skeletal example with the keys but `[…]` placeholders, then drill into each below.
2. **`layout`** — `navigation` (logo, title), `design` (variant + parameters), `theme` (full token list with the 16 colour keys), `footer` (FooterLink array).
3. **`interfaceGroups`** and **`exclusivitySets`** — simple string arrays; one paragraph each, link to Settings → Interface groups.
4. **`services[]`** — id, name, url, sourceType, format, capabilities. Note the `format` enum (wms / wmts / xyz / wfs / cog / geojson / flatgeobuf / csv / s3 / stac). Excerpt: a WMTS service and a STAC service from the demo.
5. **`sources[]` — the layer model** — explain the five-variant union (BaseLayer / LayerCard / SwipeLayer / ComparisonLayer / flexible fallback) and which fields differentiate them (`isBaseLayer`, `meta.swipeConfig`, `isSwipeLayer` / `isMirrorLayer` / `isSpotlightLayer`). Document common fields: `name`, `isActive`, `data`, `statistics`, `constraints`, `workflows`, `charts`, `exclusivitySets`, `meta`, `layout`, plus temporal fields.
6. **`data[]` / `statistics[]` (DataSourceItem)** — `url` or `images[]` (one is required), `format`, `zIndex`, `serviceId`, `layers`, `level`, `style`, `position`, `minZoom` / `maxZoom`, `timestamps`, `opacity`, `normalize`. Note that the schema is `passthrough` — extra keys (e.g. `env`, `time`, `transparent`) are preserved.
7. **`meta`** — `description`, `attribution`, `categories[]`, `colormaps[]`, `units`, `min`/`max`, `startColor`/`endColor`, `swipeConfig`, `temporal`, `fields`. One excerpt for a continuous raster (with colormap), one for categorical (with categories), one for vector (with fields).
8. **`layout` (per-source)** — `interfaceGroup`, `subinterfaceGroup`, `contentLocation`, `layerCard` (toggleable, legend, controls, showStatistics), `infoPanel` (legend, controls). Document the legend (`swatch` / `gradient` / `image`) and controls schema, and the rule that legend/controls cannot live in both `layerCard` and `infoPanel`.
9. **`constraints[]`** — `url`, `format: 'cog'`, `label`, `type` (`continuous` / `categorical` / `combined`), `interactive`, `min` / `max`, `units`, `constrainTo`, `bandIndex`. Note the conditional requirements per `type`.
10. **`workflows[]`** — `zIndex`, `service`, `label` (passthrough).
11. **`charts[]`** — `chartType` (`xy` / `pie`), `title`, `subtitle`, `x`, `traces[]`, `layout`, `pie`, `sources[]`. Sub-document trace, axis, legend, font shapes briefly, link to Charts docs.
12. **`mapConstraints`** — `zoom`, `center`, `projection`.
13. **`projections[]`** — `name`, `code`, `definition` (proj4 string), with link to Settings → CRS.

### Excerpt extraction

For each section, pull the smallest meaningful slice from `public/examples/test-config.json` that demonstrates the shape. Examples already in the demo cover all major variants (base layer, raster colormap layer, categorical layer, vector layer, swipe pair, COG constraint, chart). Done by hand during authoring — no script needed.

### Cross-links

- Add a sentence at the top of `docs/configuration/json-config.md` pointing readers to the new schema reference.
- Update the Glossary entry for "config" to link to `reference/json-schema.md`.

### Build

Run `mkdocs build --clean` to produce the rendered HTML in `public/guide/`. The new page automatically picks up the previous/next navigation and appears in the Reference section of the sidebar.

### Out of scope

- No automated schema-to-markdown generation (kept manual so the prose stays useful and the field tables match the Zod refinements / superRefine rules that wouldn't survive a generic generator).
- No changes to the Zod schema or the example config itself.