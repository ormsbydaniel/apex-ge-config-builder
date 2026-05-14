## Root cause

The "bold teal" style appears only when a tab's sidebar entry renders as a clickable section index (mkdocs-material's `navigation.indexes` feature). That feature only activates when the first entry under a section is literally `<folder>/index.md`.

Checking the current nav:

| Tab | First entry | Renders as | Style |
|---|---|---|---|
| Welcome | `index.md` | `<a class="md-nav__link--active">` | bold teal ✓ |
| Getting Started | `getting-started/index.md` | `<a>` link | bold teal ✓ |
| **Home tab** | `configuration/home.md` | `<label>` (non-link) | **grey ✗** |
| Layers tab | `layers/index.md` | `<a>` link | bold teal ✓ |
| Services tab | `services/index.md` | `<a>` link | bold teal ✓ |
| **Settings tab** | `configuration/settings.md` | `<label>` (non-link) | **grey ✗** |

Two outliers: **Home tab** and **Settings tab**. Their landing pages aren't named `index.md` and don't sit in a matching folder, so mkdocs-material can't promote them to section indexes — it falls back to a non-clickable grey label.

## Fix

Move the two landing files so each tab has a real `index.md`:

1. `docs/configuration/home.md` → `docs/home/index.md`
2. `docs/configuration/settings.md` → `docs/settings/index.md`

Update `mkdocs.yml`:

```yaml
- Home tab:
    - home/index.md
    - Run Healthcheck: services/healthcheck.md
- Settings tab:
    - settings/index.md
    - Footer links: configuration/footer-links.md
    - Layout: configuration/layout.md
    - Export options: configuration/export-options.md
```

Sweep cross-references in other `.md` files (links of the form `configuration/home.md` and `configuration/settings.md`) and update the relative paths.

Rebuild with `mkdocs build --clean` and verify both tabs now render as `<a class="md-nav__link">` in the sidebar (bold teal when active).

## Trade-offs

- The published URLs change: `/guide/configuration/home.html` → `/guide/home/index.html` and similarly for settings. Any external bookmarks to those two specific pages would break, but the guide isn't launched yet (per your earlier "hide the User Guide button before sharing" change), so this is the right time.
- All other tabs already follow the `<folder>/index.md` pattern — no changes needed there.

## Out of scope

No app code changes. Pure docs restructure + nav update + rebuild.
