# Fix tutorial screenshots that render too small

## Problem
Screenshots with a more portrait aspect ratio are given a fixed pixel width
(e.g. `width="420"`), so they render short and hard to read. The wide, short
strips were already set to `width="100%"` and look fine.

Measured aspect ratios (width ÷ height) confirm the pattern: every image with
a fixed pixel width and a ratio below ~6 renders small. Example:
`tutorial-09-03-edit-multiband-bristol.png` is 1994×440 (ratio 4.5) at
`width="420"` — only ~93 px tall on the page.

## Affected images (current width → proposed width)

| Image | Ratio | Now | New |
|---|---|---|---|
| tutorial-02-03-edit-application-title | 1.25 | 420 | 640 |
| tutorial-02-04-export | 6.06 | 640 | 100% |
| tutorial-02-08-edit-colormap | 3.69 | 420 | 100% |
| tutorial-03-03-add-service | 2.88 | 420 | 720 |
| tutorial-04-05-move-layer-land-cover | 2.62 | 560 | 720 |
| tutorial-08-04-add-statistics-source | 4.31 | 420 | 100% |
| tutorial-09-03-edit-multiband-bristol | 4.53 | 420 | 100% |
| tutorial-09-04-add-exclusivity-set-bristol-s2 | 5.47 | 420 | 100% |
| tutorial-11-04-add-crs | 4.62 | 560 | 100% |

Unchanged: the wide strips already at `width="100%"`, the QR code (245 px,
deliberately small), hero images, and `02-05` highlighted base-layers shot
(560, ratio 8.3 — already tall enough).

## Rule going forward
Pick width from aspect ratio:
- ratio < 3 (portrait-ish): 640–720 px fixed
- ratio 3–6: `width="100%"` of the content column
- ratio > 6 (thin strips): `width="100%"`
- small icons/QR: keep small fixed widths

## Steps
1. Update the nine `width="..."` attributes in the workshop Markdown files.
2. Rebuild the guide with `/tmp/mkdocs-venv/bin/mkdocs build --strict`.
3. Spot-check rendered heights in the built HTML (target: every contextual
   screenshot renders at least ~150 px tall).
4. Report; publish only when you ask.
