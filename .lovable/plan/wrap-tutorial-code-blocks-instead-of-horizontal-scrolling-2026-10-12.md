# Wrap tutorial code blocks instead of horizontal scrolling

## Problem

In the tutorials, fenced text blocks containing long single lines — layer descriptions, dataset URLs, JSON snippets — render as one unbroken line with a wide horizontal scrollbar. Users cannot read the content without scrolling. Example: exercise 2-6 step 2, where the pasted layer description renders as a single 214-character line.

## Cause (verified against the built stylesheet)

Material for MkDocs applies `white-space: pre-wrap` to code blocks only inside `@media print`. On screen, `pre` keeps the browser default (`white-space: pre`), so long lines overflow and `pre > code`'s `overflow: auto` produces the horizontal scroll bar. This is the stock behaviour of mkdocs-material 9.5.x — not something the pages are doing wrong.

## Does wrapping affect the copy button? No (verified)

- The copy button in this theme reads the code text with JavaScript (`innerText`), not from the visual layout, so CSS wrapping cannot alter what is copied.
- `innerText` is computed from the DOM text and visibility — line breaks come from actual DOM nodes, never from CSS soft wraps. Soft-wrapped display lines copy as the single original line.
- The planned rule changes only `white-space` and `word-break`; it changes no visibility, display, or content, so the copied text is byte-identical.
- This matches Material's own behaviour: the theme already applies the same wrapping rules in print mode, and the copy button works unchanged there.

## Fix

Add a rule to `docs/stylesheets/extra.css` (the guide's custom stylesheet, already wired through `extra_css` in mkdocs.yml) so all code blocks wrap on screen, matching Material's own print behaviour:

```css
.md-typeset pre,
.md-typeset pre > code {
  white-space: pre-wrap;
  word-break: break-word;
}
```

- `pre-wrap` keeps intentional line breaks (JSON snippets, command lists) intact while allowing long lines to wrap.
- `word-break: break-word` lets URLs longer than the column wrap mid-token rather than overflowing — necessary because tutorial URLs are 94–324 characters with no natural break points.
- Inline `` `code` `` spans already wrap (`word-break: break-word` in the base theme) and are unaffected.
- No Markdown content changes; every tutorial page benefits at once.

## Verification

1. Rebuild with `/tmp/mkdocs-venv/bin/mkdocs build --strict` (create the venv first if the sandbox reset: `python3 -m venv /tmp/mkdocs-venv && /tmp/mkdocs-venv/bin/pip install mkdocs-material==9.5.44 pymdown-extensions==10.11.2`).
2. Confirm the served HTML in `public/guide/` carries the updated `extra.css`.
3. User reviews 2-6 step 2 (the reported case) and the other long-line pages found in the sweep: 2-7, 2-10, 4-3, 5-3, 6-3, 6-6, 7-3 through 7-8, 8-3 through 8-6, 8-8.

Not in scope: reformatting the tutorial source text; no content edits, no navigation changes.
