# Correct tutorial numbering across MkDocs pages

## Outcome
Tutorial instructions render as one continuous numbered sequence even when a step contains an image, code block, nested bullet list, continuation paragraph, or callout. Tutorial 5-3 will display steps 1–8 without restarting.

## Changes
- Correct Tutorial 5-3 first by nesting its code block, screenshots, supporting bullet, wrapped text, and information callout under their intended numbered steps using MkDocs/Python-Markdown’s required four-space indentation.
- Enable the built-in `sane_lists` Markdown extension so an intentionally continued ordered list preserves its authored starting number if a valid block boundary still creates a separate list.
- Audit all workshop Markdown pages for the same interruption patterns and apply only formatting changes needed to keep each instruction sequence continuous. Preserve tutorial wording, step order, links, images, and callout content.
- Keep genuinely separate numbered exercises as separate lists; do not force unrelated sections into one sequence.

## Verification
- Build the guide in strict mode.
- Inspect the generated HTML for Tutorial 5-3 and every adjusted page, confirming ordered-list numbering is continuous and nested images, lists, code blocks, and callouts remain inside the intended step.
- Confirm callouts still render as callouts and nested bullets do not become numbered steps. Do not publish.

## Technical details
Python-Markdown requires four-space indentation for blocks nested under ordered-list items. Tutorial 5-3 currently uses three-space indentation for several child blocks and places its information callout at the page root, which breaks the ordered-list structure. `sane_lists` provides a safe fallback by honoring explicit ordered-list start values, but correct nesting remains the primary fix.
