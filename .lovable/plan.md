## Goal

On each tutorial step page, show a small "eyebrow" line with the tutorial name directly above the existing H1 step heading. Sidebar labels, front-matter titles and browser tab titles stay exactly as they are.

Example, on `docs/workshops/02-getting-started/05-add-base-maps.md`:

```text
2. MY FIRST CONFIG          <- new eyebrow (small, muted, uppercase)
2-5. Add recommended base maps   <- existing H1, unchanged
```

## Approach

Do it once in JavaScript rather than editing ~40 markdown files. This keeps the markdown clean and means renaming a tutorial only touches one place.

1. **`docs/javascripts/nav-groups.js`** (already loaded on every page) — add a small routine that:
   - Reads the current path; if it matches `/workshops/<slug>/` and is **not** the tutorial `index` page, derives the tutorial slug (e.g. `02-getting-started`).
   - Looks up the tutorial title from a slug → title map defined at the top of the file, alongside the existing Core/Topics group lists (`01-familiarisation` → "1. Familiarisation", … `06-constraints` → "6. Constraints").
   - Inserts a `<p class="tutorial-eyebrow">` element immediately before the first `h1` inside the article content, skipping insertion if one already exists (guards against re-runs on instant-navigation page loads).
   - Hooks into Material's `document$` observable when available so it also runs on instant navigation, falling back to `DOMContentLoaded`.

2. **`docs/stylesheets/extra.css`** — add a `.tutorial-eyebrow` rule: small font size (~0.75rem), uppercase, letter-spaced, muted colour using Material's `--md-default-fg-color--light` token, tight bottom margin so it sits close to the H1, and no top margin clash with the content area.

3. **Rebuild** with `mkdocs build --strict` and verify with a Playwright screenshot on a deep step page (e.g. tutorial 4 step 3) and confirm tutorial `index.md` pages are unaffected.

## Notes

- Single-H1 and SEO structure are unchanged; the eyebrow is a paragraph, not a heading.
- No markdown, `mkdocs.yml` nav, or front-matter changes.
- Titles live in one map in `nav-groups.js`; adding tutorial 7 means adding one line there.
