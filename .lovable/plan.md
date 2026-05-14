## Plan

Capture screenshots via the in-app browser and embed them into the nine Phase 1 documentation pages, matching the style of `docs/services/healthcheck.md` (a "Follow along" admonition pointing at the Comprehensive demo, plus inline `![alt](path)` figures with descriptive alt text).

### Pages and screenshots to capture

For each page below, the browser will load the Comprehensive demo, navigate to the relevant tab/dialog, capture, and save to `docs/assets/screenshots/<filename>.png`.

1. **`configuration/home.md`** — Home tab overview, QA cards close-up, healthcheck launch button.
   - `home-tab-overview.png`, `home-qa-cards.png`
2. **`configuration/settings.md`** — Settings tab, branding section, map defaults, CRS list.
   - `settings-tab.png`, `settings-branding.png`, `settings-crs.png`
3. **`configuration/interface-groups.md`** — Interface Groups manager, add/edit dialog.
   - `interface-groups-list.png`, `interface-groups-edit.png`
4. **`configuration/preview.md`** — GE Preview tab with demo loaded, version switcher.
   - `ge-preview-loaded.png`, `ge-preview-version-switch.png`
5. **`services/overview.md`** — Services tab with validated services.
   - `services-tab.png`, `services-validation-states.png`
6. **`services/adding-services.md`** — Add Service dialog (WMTS example), validation result.
   - `services-add-dialog.png`, `services-add-validated.png`
7. **`layers/overview.md`** — Layers tab showing interface group hierarchy.
   - `layers-tab-hierarchy.png`
8. **`layers/adding-layers.md`** — Add Layer flow: data source picker, layer card after add.
   - `layers-add-datasource.png`, `layers-card-after-add.png`
9. **`getting-started/first-config.md`** — Step-by-step screenshots aligned with the tutorial steps (load example → add service → add layer → run healthcheck → preview).
   - `first-config-step1-load.png` through `first-config-step5-preview.png`

### Editing pattern per page

- Add a `!!! tip "Follow along"` admonition near the top (same wording as healthcheck page).
- Insert each `![alt](../assets/screenshots/<name>.png)` figure immediately after the section it illustrates, with descriptive alt text.
- Keep all existing prose; only add the admonition and figures.

### Workflow

1. Open the live preview via `browser--navigate_to_sandbox`, load the Comprehensive demo from **Home → Load → Examples**.
2. For each screenshot: navigate, observe, optionally interact (open dialog, switch tab), `browser--screenshot`, then copy result into `docs/assets/screenshots/`.
3. Edit each Markdown file to insert the admonition and figures.
4. Run `mkdocs build` to confirm the guide builds cleanly with all referenced images present.

### Notes

- Some states the browser may not be able to reach reliably (mid-validation toasts, transient spinners). For any state that fails after one retry, I'll skip it, finish the rest, and list the missing screenshots at the end so you can capture them manually.
- All captures use the current preview viewport (1261x853). I won't resize unless a screenshot needs a wider canvas.
- No source code in `src/` will be modified.