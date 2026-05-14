## Goal

Produce a comprehensive **end-user guide** for the APEX GE Config Builder as a set of MkDocs-ready markdown files under `public/docs/`, with screenshots captured from the live preview for each major feature.

The audience is config authors (non-developers): people who use the app to build, validate, and export viewer configurations. No internal architecture, no hook/file references.

## Output structure

```text
public/docs/
  index.md                          # Landing: what the app does, who it's for
  getting-started/
    overview.md                     # Concepts: config, services, layers, interface groups
    first-config.md                 # Walkthrough: build a config from scratch
    loading-saving.md               # Load, import, export, unsaved-changes guard
  configuration/
    home.md                         # Home tab: title, branding, footer, healthcheck entry
    layout.md                       # Global layout variants
    settings.md                     # Settings tab + projections (CRS)
    draw-order.md                   # Draw order tab
    preview.md                      # Preview tab + viewer versions
    footer-links.md                 # Footer links editor
    interface-groups.md             # Interface group manager
    export-options.md               # Export dialog and JSON ordering
  services/
    overview.md                     # Service types + service manager
    adding-services.md              # SourceForm, supported formats
    diagnostics.md                  # Service diagnostics + healthcheck dialog
    healthcheck.md                  # Run Healthcheck tool — full walkthrough (worked example)
    recommended.md                  # Recommended services modal
  layers/
    overview.md                     # Layer hierarchy, sub-interface groups
    adding-layers.md                # Layer card form, type selector
    base-layers.md                  # Base layer form
    swipe-layers.md                 # Swipe layer setup
    data-visualisation.md           # Mutually exclusive styling tools
    rgb-composite.md                # RGB composite + advanced settings
    vector-styling.md               # Style editor, filters, stops, markers
    vector-fields.md                # Fields editor (auto-detect from GeoJSON/FGB)
    categories.md                   # Categories / colormaps
  data-sources/
    cog.md                          # COG metadata, performance guards
    wms-wmts-wfs.md
    xyz.md
    geojson-flatgeobuf.md
    csv.md
    s3-browser.md                   # Hierarchical S3 navigation
    stac-browser.md                 # STAC: catalog, collection, item, static collections
  charts/
    overview.md                     # Supported types + roadmap
    visual-editor.md                # X/Y quick add, traces
    pixel-values.md                 # Spectral signatures from COGs
    field-values.md                 # GeoJSON/FGB property pies
    csv-data.md                     # Date detection, numeric parsing
  reference/
    url-parameters.md               # Initial-state URL config
    keyboard-and-tips.md            # Tooltips, double-click bounds, etc.
    troubleshooting.md              # Common errors + fixes
    glossary.md                     # CRS, COG, STAC, FGB, etc.
  assets/
    screenshots/                    # PNGs captured from preview
mkdocs.yml                          # Sidebar/nav config at repo root
```

Each page follows a consistent template: short intro, "When to use", numbered steps, screenshot(s), notes/tips, related-pages links.

## Worked example: Run Healthcheck

The Healthcheck page (`services/healthcheck.md`) is the showcase chapter — used to validate the documentation tone, depth, and screenshot style before scaling to the rest. It will cover:

- What the healthcheck does (URL reachability, GetCapabilities probes, performance warnings, payload size flags).
- How to launch it from the Services manager and from the Home tab healthcheck score gauge.
- Reading results: per-URL status (`valid`, `error`, `performance-warning`, `skipped`, `not-validated`), HTTP codes, warning text, and reported payload size.
- The healthcheck score gauge on the Home tab and how the score is composed.
- Drilling into per-layer issues via the Layer Issues dialog.
- Re-running after fixes and the unsaved-changes guard interaction.
- Common failure modes and remedies (CORS, 403 from S3, timeouts, large payloads above the 2 MB advisory threshold).

## Screenshot strategy

- Use the live preview at `https://id-preview--9bb07bee-4165-4b4f-9e47-3faa51db4431.lovable.app` via the browser tool.
- **Demo data**: load the **"comprehensive demo example"** config (from the Load Config dialog) before capturing any screenshots that need realistic services, layers, charts, or healthcheck results. All examples in the docs should reference items that exist in that config so screenshots and prose stay in sync.
- Standard viewport: 1366x768 for full-screen shots; cropped close-ups via `image_tools--zoom_image` for dialogs and form details.
- One overview shot per page plus close-ups for any non-obvious control. Estimated ~40-60 screenshots.
- Stored in `public/docs/assets/screenshots/` and referenced with relative paths so MkDocs and GitHub both render them.

## MkDocs readiness

- Add `mkdocs.yml` with `material` theme nav reflecting the structure above.
- Frontmatter with `title:` on each page so it works with both Material for MkDocs and a future Docusaurus migration.
- Internal links use relative paths (`../layers/overview.md`) so they work both rendered and on GitHub.
- No build step required for this repo — files ship under `public/docs` and are viewable on GitHub or via `mkdocs serve` from the repo root.

## Approach (execution phases)

1. **Scan the app surface** — read each tab/dialog/component to confirm features and current labels (no code changes).
2. **Skeleton** — create all markdown files with frontmatter, headings, and TODOs for screenshots.
3. **Capture** — load the comprehensive demo example config in the preview, walk every tab/dialog, take screenshots, save into `assets/screenshots/`.
4. **Write the showcase chapter first** — fill in `services/healthcheck.md` end-to-end so you can review tone and depth before I commit to all 40 pages.
5. **Write remaining pages** area-by-area, using captured UI as ground truth so labels match exactly.
6. **Wire up** — `mkdocs.yml` nav, landing `index.md`, cross-links.
7. **QA** — spot-check rendered markdown, verify all screenshot paths resolve, verify no broken internal links.

## Out of scope

- Developer/architecture docs (hooks, schemas, file layout).
- In-app help drawer rendering these docs (could be a follow-up).
- Translations.
- Auto-generated reference from Zod schemas (could be a follow-up).

## Deliverable size estimate

~35-45 markdown pages, ~40-60 screenshots, one `mkdocs.yml`. I'll deliver in stages: skeleton + Getting Started + the Run Healthcheck showcase chapter first, then continue area-by-area after your review.
