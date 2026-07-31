## Goal

Make the Tutorials tab shallow and scannable: one flat list of tutorials (each with its steps), plus tags so people can filter by track and topic. No files move, so all current URLs keep working.

## Navigation

`mkdocs.yml` replaces the `Core` / `Topics` / per-topic groups with a single flat list:

```text
Tutorials
  Overview
  Browse by tag
  Familiarisation            > 1..3 steps
  My first config            > 1..9 steps
  Working with services      > 1..5 steps
  Categories for WMS and COG > 1..5 steps
  Timestamps for COG and STAC> 1..3 steps
  Timestamps for WMS services> 1..3 steps
  Constraints: categorical and continuous > 1..3 steps
```

Depth drops from five levels to three (Tab > Tutorial > Step). Core tutorials stay first, in order; topic tutorials follow. Track membership is carried by tags and by the tables on the overview page, not by nav nesting.

File paths under `docs/tutorials/core/...` and `docs/tutorials/topics/...` are left exactly as they are — the flattening is nav-only.

## Collapsed by default

The theme already omits `navigation.expand`, so sections stay collapsed; the deep nesting was what made it feel auto-expanding. With the flat list only the current tutorial's step list opens. `navigation.indexes` stays so each tutorial's Overview is the clickable parent, and `navigation.prune` stays so the sidebar only renders the active branch.

## Tags

Enable Material's built-in `tags` plugin and add a `docs/tutorials/tags.md` page (`Browse by tag`) that renders the tag index. Because adding a `plugins:` block disables the implicit search plugin, `search` is listed explicitly alongside it.

Tags go in the front matter of each tutorial's `index.md`, drawn from a small controlled set:

| Tutorial | Tags |
|---|---|
| Familiarisation | `core`, `orientation` |
| My first config | `core`, `layers`, `cog`, `wms` |
| Working with services | `core`, `services`, `wms`, `stac` |
| Categories for WMS and COG | `topic`, `categorical`, `wms`, `cog` |
| Timestamps for COG and STAC | `topic`, `time-series`, `cog`, `stac` |
| Timestamps for WMS services | `topic`, `time-series`, `wms` |
| Categorical and continuous constraints | `topic`, `constraints`, `cog` |

Tags render as clickable chips at the top of each tutorial page and are searchable, so "show me everything about WMS" works across tracks.

## Overview page

`docs/tutorials/index.md` keeps its Core and Topic tables — that is where the track structure now lives — and gains a line pointing at **Browse by tag** for cross-cutting filtering. Its wording drops any implication that the sidebar groups tutorials by track.

## Technical notes

- Only `mkdocs.yml`, `docs/tutorials/index.md`, `docs/tutorials/tags.md` (new) and the seven tutorial `index.md` front matter blocks change; step pages are untouched.
- The `tags` plugin ships with mkdocs-material — no new dependency, but the docs build workflow is checked to confirm the installed Material version includes it.
- Rebuild with `mkdocs build --strict` to confirm nav, tag index and links all resolve.
