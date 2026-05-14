# Screenshot conventions

All documentation screenshots live in **two** places that must stay in sync:

- `docs/assets/screenshots/` — mkdocs source, referenced from `.md` files as
  `../assets/screenshots/<name>.png`.
- `public/guide/assets/screenshots/` — copy served by the running app's
  in-product guide.

Use `scripts/add-screenshot.sh <src> <name>` to write to both at once.

## Naming

Kebab-case, lowercase, no spaces, `.png` extension. Format:

```
<area>[-<subject>][-<state>].png
```

- `<area>` — top-level page or feature, matching the docs section folder where
  possible (`home`, `layers`, `layer-card`, `data-sources`, `stac-browser`,
  `s3-browser`, `services`, `settings`, `draw-order`, `charts`, `statistics`,
  `constraints`, `configuration`, `preview`, `healthcheck`).
- `<subject>` — what is on screen (`edit-top`, `controls-exclusivity`,
  `statistics-tab`, `cog-detected`).
- `<state>` — optional modifier when multiple states are needed (`loaded`,
  `running`, `complete`, `fail`, `poor`).

Examples already in use:

- `home-tab-loaded.png`
- `layer-card-edit-top.png`
- `layer-card-controls-exclusivity.png`
- `data-sources-statistics-tab.png`
- `stac-browser-items.png`
- `s3-browser-cog-detected.png`
- `healthcheck-row-details-fail.png`

Avoid version numbers, dates, or screenshot tool IDs in filenames — overwrite
the existing file when a UI change makes a shot stale.
