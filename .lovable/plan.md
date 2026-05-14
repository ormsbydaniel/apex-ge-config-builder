## Final nav restructure plan

Apply the revised nav with shorter section labels, and create three new stub pages so the build is clean.

### `nav:` to write into `mkdocs.yml`

```text
- Home: index.md

- Getting Started:
    - Overview: getting-started/overview.md
    - Build your first config: getting-started/first-config.md
    - Loading and saving: getting-started/loading-saving.md

- Home tab:
    - Overview: configuration/home.md
    - Run Healthcheck: services/healthcheck.md

- Layers tab:
    - Overview: layers/overview.md
    - Interface groups: configuration/interface-groups.md
    - Adding layers: layers/adding-layers.md
    - Base layers: layers/base-layers.md
    - Swipe layers: layers/swipe-layers.md

- Data sources:
    - COG: data-sources/cog.md
    - WMS / WMTS / WFS: data-sources/wms-wmts-wfs.md
    - XYZ: data-sources/xyz.md
    - GeoJSON / FlatGeoBuf: data-sources/geojson-flatgeobuf.md
    - CSV: data-sources/csv.md
    - S3 browser: data-sources/s3-browser.md
    - STAC browser: data-sources/stac-browser.md

- Data visualisation:
    - Overview: layers/data-visualisation.md
    - RGB composite: layers/rgb-composite.md
    - Vector styling: layers/vector-styling.md
    - Vector fields: layers/vector-fields.md
    - Categories and colormaps: layers/categories.md

- Statistics:
    - Overview: statistics/overview.md

- Constraints:
    - Overview: constraints/overview.md

- Charts:
    - Overview: charts/overview.md
    - Visual editor: charts/visual-editor.md
    - Pixel values: charts/pixel-values.md
    - Field values: charts/field-values.md
    - CSV data: charts/csv-data.md

- Draw order tab: configuration/draw-order.md

- Services tab:
    - Overview: services/overview.md
    - Adding services: services/adding-services.md
    - Diagnostics: services/diagnostics.md
    - Recommended services: services/recommended.md

- Settings tab:
    - Overview: configuration/settings.md
    - Footer links: configuration/footer-links.md
    - Layout: configuration/layout.md
    - Export options: configuration/export-options.md

- JSON config: configuration/json-config.md

- GE Preview tab: configuration/preview.md

- Reference:
    - URL parameters: reference/url-parameters.md
    - Tips and shortcuts: reference/keyboard-and-tips.md
    - Troubleshooting: reference/troubleshooting.md
    - Authors guide: reference/authors-guide.md
    - Glossary: reference/glossary.md
```

### Files to create (stubs, ~10 lines, "Coming soon" admonition matching existing style)

- `docs/statistics/overview.md` — Layer-card Statistics section overview.
- `docs/constraints/overview.md` — Layer-card Constraints section overview.
- `docs/configuration/json-config.md` — JSON config tab overview (raw JSON view, validation, copy/paste workflow).

### Files to edit

- `mkdocs.yml` — replace the `nav:` block with the structure above.

### Build verification

- Run `mkdocs build --strict` after the edit to confirm no broken links and that all referenced files exist.
- Spot-check the rendered sidebar in `public/guide/` to confirm sections appear in the intended order.

### Out of scope

- No content changes to existing pages.
- No `src/` changes.
- Future content phases (filling in stubs with screenshots) remain a separate effort.
