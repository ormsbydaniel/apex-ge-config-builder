## Goal

Visually split the Tutorials sidebar into **Core** (tutorials 1-3) and **Topics** (tutorials 4-6) using CSS only — the nav stays flat, numbering unchanged, no extra indent level.

## Resulting sidebar

```text
Tutorials
  Overview
  ──── CORE ────────────
  1. Familiarisation
  2. My first config
  3. Working with Services
  ──── TOPICS ──────────
  4. Categorical Data
  5. Time Series
  6. Constraints
```

## Changes

1. `docs/stylesheets/extra.css` — add a rule scoped to the Tutorials tab's nav list that:
   - injects a small uppercase, muted "Core" label via `::before` on the tutorial-1 item, and "Topics" on the tutorial-4 item;
   - adds a thin top border/spacing above each labelled item so the groups read as separated blocks;
   - uses Material's own tokens (`--md-default-fg-color--light`, `--md-default-fg-color--lightest`) so it works in both light and slate palettes.

   Scoping: the tutorials list is identified by its nested nav container on `workshops/*` pages, and the two group starts are selected positionally (the items following the Overview entry, and the fourth tutorial entry) since MkDocs renders group headers as `<label>` elements with no stable class per item.

2. Rebuild the guide with `mkdocs build --strict` so `public/guide/` picks up the updated stylesheet.

3. Manual visual check of the rendered sidebar in the Tutorials section (light and dark palette) before finishing.

## Notes and trade-offs

- Nothing in `mkdocs.yml`, no page titles, filenames or links change — zero risk to existing content or screenshots.
- Because the labels are positional CSS, they need adjusting if tutorials are reordered or a new tutorial is inserted. I'll add a short comment in `extra.css` stating that the rule assumes tutorials 1-3 = Core and 4+ = Topics.
- The labels are decorative (`::before` content), so they are non-interactive and won't affect Previous/Next navigation or search.
