# Swap Tutorial 4 file names to match their content

Two files in Tutorial 4 have filenames swapped relative to their content:

- `docs/workshops/04-fine-tuning/02-layer-controls.md` — contains "4-2. Specifying layer units"
- `docs/workshops/04-fine-tuning/03-specifying-layer-units.md` — contains "4-3. Experiment with layer controls"

## Changes

1. Rename the files so names match content (via `git mv` semantics with `mv`):
   - `02-layer-controls.md` → `02-specifying-layer-units.md`
   - `03-specifying-layer-units.md` → `03-layer-controls.md`
2. Update the two references to the new paths:
   - `docs/workshops/04-fine-tuning/index.md` steps list
   - `mkdocs.yml` nav (Tutorial 4 section)
3. No other files reference these paths (verified by search), and the page
   content itself is unchanged — only filenames and links move.

## Verify

- Run `python3 -m mkdocs build --strict` and confirm it passes with no broken links.
- Confirm `public/guide/workshops/04-fine-tuning/` contains
  `02-specifying-layer-units.html` and `03-layer-controls.html` and the old
  filenames are gone.
- Not published; the user reviews in the preview.
