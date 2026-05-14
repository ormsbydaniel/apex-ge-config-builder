## Add Previous / Next navigation to the docs

mkdocs-material has a built-in feature that renders **Previous** and **Next** links at the bottom of every documentation page, following the order defined in `nav:` in `mkdocs.yml`. We just need to enable it.

### Change

In `mkdocs.yml`, add `navigation.footer` to the theme features list:

```yaml
theme:
  name: material
  features:
    - navigation.tabs
    - navigation.tabs.sticky
    - navigation.indexes
    - navigation.prune
    - navigation.top
    - navigation.footer   # ← new
    ...
```

### Result

Every page gets a footer block like:

```text
← Previous: Build your first config        Next: Loading and saving →
```

The order follows the existing `nav:` tree — e.g. on the Getting Started → Overview page, Previous goes to Welcome and Next goes to "Build your first config". No per-page edits needed.

### Build

Run `mkdocs build --clean` so the rebuilt HTML in `public/guide/` includes the new footer on every page.

No content changes, no styling changes, no broken links — purely a theme feature toggle.