# Replace "GE Preview" with "Preview" across the guide

## Goal

The app's tab is labelled **Preview** (verified in `src/components/ConfigBuilder.tsx`), but the guide says **GE Preview** in 32 places. Replace every mention with "Preview" so the docs match the UI, across the whole guide (not just tutorials).

## Changes

### Mechanical replacement — `GE Preview` → `Preview`

All occurrences in these files (verified by search):

- `mkdocs.yml` (nav entry: `- GE Preview:` → `- Preview:`)
- `docs/configuration/preview.md` — 10 mentions (title, heading, body, alt text, headings "Opening GE Preview" / "When to use GE Preview vs. healthcheck")
- `docs/index.md` — 1
- `docs/getting-started/overview.md` — 1
- `docs/getting-started/first-config.md` — 4
- `docs/reference/troubleshooting.md` — 1
- `docs/reference/keyboard-and-tips.md` — 1
- `docs/layers/standard-layers.md` — 1
- `docs/layers/swipe-layers.md` — 1
- `docs/workshops/09-coordinate-reference-systems/index.md` — 1
- `docs/workshops/02-getting-started/02-key-concepts.md` — 1
- `docs/workshops/02-getting-started/05-add-base-maps.md` — 1
- `docs/workshops/02-getting-started/08-colormaps.md` — 1 (image alt text)
- `docs/workshops/04-fine-tuning/03-layer-controls.md` — 5
- `docs/workshops/04-fine-tuning/04-default-start-location.md` — 1
- `docs/workshops/04-fine-tuning/index.md` — 1

Screenshot filenames (e.g. `ge-preview-loaded.png`) stay as-is — only visible text changes.

### Small wording touch-ups where a plain replace reads badly

- `docs/configuration/preview.md` line 6: "The **Preview** tab (rendered as **GE Preview** in the navigation) runs …" — the parenthetical becomes wrong; reword to "The **Preview** tab runs …"
- `docs/getting-started/first-config.md` line 118: heading "Preview in GE Preview" would become "Preview in Preview" — reword to "Preview the config".

## Verification

- `rg -ni "ge.?preview" docs/ mkdocs.yml` returns no matches (excluding screenshot filenames).
- Rebuild: `python3 -m mkdocs build --strict` — must pass; confirm the nav entry and affected pages render with "Preview".
- Do not publish; the user reviews in preview as usual.
