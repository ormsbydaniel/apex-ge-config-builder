## Goal

Make the left navigation behaviour consistent across every section so it's predictable what clicking a parent vs a child does.

## Current confusion

| Section | Parent click goes to… | Why it's confusing |
|---|---|---|
| Layers | `layers/index.md` ("Layers overview") | OK — has overview content |
| Layers › Layers | `layers/types/index.md` | OK |
| Layers › Data sources | First child (COG) | No overview at all — jumps into a data-source page |
| Layers › Data visualisation | `layers/data-visualisation.md` | Overview page has same title as parent → looks duplicated |
| Layers › Charts | `charts/index.md` ("Charts overview") | Page heading says "Charts overview" but nav label says "Charts" — feels mismatched |
| Services / Settings / Recipes | Their `index.md` | Same pattern as Layers, generally fine |
| Reference | First child (URL parameters) | No overview |

Today this relies on MkDocs Material's `navigation.indexes` feature, which silently attaches the section's `index.md` to the parent. When there's no `index.md` (Data sources, Reference), the parent falls through to the first child — that's the root cause of the COG jump.

## Proposed pattern (matches your inclination)

Every nav section gets a child entry called **"Overview"** that points at the section's index page, AND the parent label keeps navigating to the same page. So:

```text
Charts                     ← clicking goes to overview
  Overview                 ← clicking also goes to overview
  Visual editor
  Pixel values
  …
```

This is achieved by:

1. **Keeping `navigation.indexes` enabled** so the parent label stays clickable.
2. **Adding an explicit `Overview: …/index.md` entry** as the first child of every section. Material renders this as a normal child link even when the same file is the section index, so users see a consistent "Overview" affordance and never get dropped into an unrelated page.
3. **Renaming page H1s to plain "Overview"** inside section index files, since the breadcrumb / section label already says e.g. "Charts". This removes the "Charts → Charts overview" double-naming.

## Concrete changes

### `mkdocs.yml` — add Overview entries and create missing overviews

For each multi-page section, add `- Overview: <section>/index.md` as the first child:

- Getting Started → `getting-started/index.md` (already first, just relabel from auto-title to "Overview")
- Home tab → `home/index.md`
- Layers tab → `layers/index.md`
- Layers › Layers → `layers/types/index.md`
- Layers › Data sources → **new** `data-sources/index.md` (needs to be created)
- Layers › Data visualisation → `layers/data-visualisation.md` (rename file to `layers/data-visualisation/index.md` OR keep file path and just relabel — see Technical notes)
- Layers › Charts → `charts/index.md`
- Services tab → `services/index.md`
- Settings tab → `settings/index.md`
- How-to recipes → `recipes/index.md` (and each sub-group: Data sources & services, Visualisation, Organisation & UX, Charts, Lifecycle — these are flat right now with no overviews; leave them as-is since they're shallow groupings)
- Reference → **new** `reference/index.md` (needs to be created)

Single-page tabs (Draw order, JSON config, GE Preview) stay unchanged — no children, no confusion.

### New files to create

1. `docs/data-sources/index.md` — short overview of the seven data-source types with links to each. Title: "Overview", H1 "Data sources overview" (or just "Overview" — pick one and apply consistently, see below).
2. `docs/reference/index.md` — short index of the reference pages.

### Page H1 / title cleanup for consistency

Pick **one** convention and apply everywhere. Recommendation: keep H1s descriptive (e.g. "Charts overview", "Data sources overview") because page headings are read out of nav context (search results, deep links, print), but use **`Overview`** as the *nav label* via the explicit `- Overview: …` entry. This is the smallest change and reads well in both places.

Files needing H1/title touch-ups for consistency:

- `docs/settings/index.md` — change H1 to "Settings overview" (currently "Settings")
- `docs/getting-started/index.md` — change H1 to "Getting started overview" (currently bare "Overview")
- `docs/recipes/index.md` — change H1 to "How-to recipes overview"
- `docs/home/index.md` — change H1 to "Home tab overview"
- `docs/layers/types/index.md` — change H1 to "Layers overview" (and rename existing `docs/layers/index.md` H1 to "Layers tab overview" to disambiguate the two "Layers" sections)
- `docs/layers/data-visualisation.md` — keep H1 "Data visualisation" (it's already fine once nav label is "Overview")
- New `data-sources/index.md` and `reference/index.md` — H1 "Data sources overview" / "Reference overview"

### Rebuild

Run `python3 -m mkdocs build --clean` after edits so `public/guide/` is in sync.

## Technical notes

- Material's `navigation.indexes` attaches `index.md` to its section when no other entry references it. Listing the same file again as `- Overview: …/index.md` does **not** cause duplicates — Material recognises it's the section index and renders only the explicit entry while keeping the parent clickable. Verified pattern is used in Material's own docs.
- `docs/layers/data-visualisation.md` is a regular file, not an `index.md`. Material accepts non-`index.md` files as the section index when listed first without a label. Keeping the filename avoids breaking inbound links from other docs and the search index.
- No source code changes; this is documentation + `mkdocs.yml` only.

## Out of scope

- Restructuring the recipes sub-groups (they're shallow lists, no parent click confusion).
- Rewording any page body content beyond H1s.
