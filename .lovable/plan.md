# Balanced docs navigation overhaul

Apply the recommended combination: top tabs for app areas, collapsed left sidebar for the active tab, clickable group titles via section index pages, and a smaller per-page payload via `navigation.prune`.

## Changes

### 1. `mkdocs.yml` — theme features

Replace the current `features` block:

```yaml
theme:
  name: material
  features:
    - navigation.tabs          # NEW — top-row tabs per top-level group
    - navigation.tabs.sticky   # NEW — keep tabs visible on scroll
    - navigation.sections      # keep — bold group headers inside the active tab
    - navigation.indexes       # keep — clickable group titles
    - navigation.prune         # NEW — ship only the active branch's HTML
    - navigation.top           # keep
    - content.code.copy        # keep
    - content.tabs.link        # keep
    # REMOVED: navigation.expand
```

Also enable richer search:

```yaml
    - search.suggest
    - search.highlight
```

### 2. Promote section overviews to `index.md`

For each group whose first child is currently `…/overview.md`, rename the file to `index.md` and update `mkdocs.yml` so the group entry points at the folder. The redundant "Overview" child disappears and the group title in the sidebar/tab becomes clickable.

Renames (file + nav entry):

- `docs/getting-started/overview.md`     → `docs/getting-started/index.md`
- `docs/layers/overview.md`              → `docs/layers/index.md`
- `docs/layers/data-visualisation.md`    → `docs/layers/data-visualisation/index.md` (move into folder, or keep flat and just update nav)
- `docs/statistics/overview.md`          → `docs/statistics/index.md`
- `docs/constraints/overview.md`         → `docs/constraints/index.md`
- `docs/charts/overview.md`              → `docs/charts/index.md`
- `docs/services/overview.md`            → `docs/services/index.md`
- `docs/configuration/settings.md`       → keep as the Settings tab landing (already a single page); just point the group at it
- `docs/configuration/home.md`           → keep as Home tab landing

Single-page groups (`Draw order tab`, `JSON config`, `GE Preview tab`) stay as flat top-level entries — they already render as one tab each.

### 3. Updated `nav:` block

Same top-level groupings as today (so the tab row matches the app's tab structure), but each group points at its index page:

```yaml
nav:
  - Home: index.md
  - Getting Started:
      - getting-started/index.md
      - Build your first config: getting-started/first-config.md
      - Loading and saving: getting-started/loading-saving.md
  - Home tab:
      - configuration/home.md
      - Run Healthcheck: services/healthcheck.md
  - Layers tab:
      - layers/index.md
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
      - layers/data-visualisation.md
      - RGB composite: layers/rgb-composite.md
      - Vector styling: layers/vector-styling.md
      - Vector fields: layers/vector-fields.md
      - Categories and colormaps: layers/categories.md
  - Statistics: statistics/index.md
  - Constraints: constraints/index.md
  - Charts:
      - charts/index.md
      - Visual editor: charts/visual-editor.md
      - Pixel values: charts/pixel-values.md
      - Field values: charts/field-values.md
      - CSV data: charts/csv-data.md
  - Draw order tab: configuration/draw-order.md
  - Services tab:
      - services/index.md
      - Adding services: services/adding-services.md
      - Diagnostics: services/diagnostics.md
      - Recommended services: services/recommended.md
  - Settings tab:
      - configuration/settings.md
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

### 4. Internal link sweep

After the renames, grep `docs/**/*.md` for references to the moved files (e.g. `getting-started/overview.md`, `layers/overview.md`) and rewrite them to the new `…/` (folder) URLs. mkdocs would emit warnings on build for any miss.

### 5. Rebuild the served site

`public/guide/` is the pre-built site. `mkdocs` is not in the sandbox PATH, so the rebuild step is:

```bash
pip install --quiet mkdocs-material
mkdocs build --clean
```

Then commit the regenerated `public/guide/` tree alongside the source changes (matches existing project convention — `public/guide/` is checked in).

## Result

- Top of the page gains a sticky tab bar with ~13 entries mirroring the app's tabs
- Left sidebar shows only the active tab's pages (5–7 items typical, was 55)
- Clicking a group title (e.g. "Charts") loads its overview page directly
- Search dropdown shows live suggestions and term highlighting
- Header teal and all existing content unchanged

## Risks / things to check after build

- Tab row width at 1080px — if it wraps, we drop one tab by folding `JSON config` + `GE Preview tab` into `Settings tab`
- A handful of cross-page links may need updating after the `overview.md` → `index.md` renames; the build log surfaces these
- `navigation.prune` slightly changes anchor behavior for very deep links — verify the existing screenshot deep-links in `docs/index.md` still resolve
