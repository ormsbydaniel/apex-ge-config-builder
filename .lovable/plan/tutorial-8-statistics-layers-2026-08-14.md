# Tutorial 8: Statistics layers

A new workshop tutorial that teaches how to attach zonal statistics (NUTS boundary
FlatGeoBuf files) to a World Cover 2021 WMS layer, based on the supplied
`world-cover-2021-with-nuts-statistics` configuration.

## Structure

New folder `docs/workshops/08-statistics/` with the standard tutorial pattern
(overview + prerequisites + key concepts + practical steps), registered in
`mkdocs.yml` under Tutorials.

- **8-1. Pre-requisites** — core tutorials 1–3; tutorial 5 (categorical data)
  strongly recommended since the World Cover class list is reused. Can be done in
  the working config or a fresh one.
- **8-2. Key concepts** — what statistics sources are, how they differ from the
  layer's display data, that they are vector (FlatGeoBuf / GeoJSON) zonal summary
  files whose attributes hold pre-computed class areas, what the `level` property
  means (NUTS 0 = country … 3 = small regions, chosen by map zoom), and where the
  user sees them in the Explorer (the **Statistics** tab, then click a feature).
- **8-3. Add the World Cover layer** — Land Cover interface group, "World Cover"
  sub-group, WMS source from `https://mapproxy.terrascope.be/mapproxy/service`,
  layer `esa-worldcover-map-10m-2021-v2_map`, version 1.3.0, time parameter on,
  timeframe Years, copyable description and attribution, swatch legend, category
  list copied from an existing layer or CSV (referencing tutorial 5).
- **8-4. Add the first statistics source** — Data Sources → **Statistics** tab →
  Add source, format FlatGeoBuf, level 0 URL, explain the level field being
  auto-assigned and the zIndex of 100.
- **8-5. Add the remaining NUTS levels** — levels 1, 2 and 3 as separate copyable
  code blocks; explain automatic level increment and how to correct a level.
- **8-6. Panel and controls** — content location Info panel, toggleable layer card,
  opacity slider, temporal controls, blend controls, exclusivity set `worldcover`,
  and the description hint telling users to open the Statistics tab.
- **8-7. Preview and review** — open the GE preview, switch to the Statistics tab,
  click a country then zoom in to see finer NUTS levels take over; full JSON
  reference and a troubleshooting list (wrong CRS, missing level, empty results,
  file not reachable).

## Screenshots

Placeholders will be referenced from `docs/assets/screenshots/` using the existing
naming convention (e.g. `statistics-tab-add-source.png`,
`statistics-nuts-level0-result.png`). I will capture what can be produced from the
builder UI; any Explorer-side result screenshots will be flagged for you to supply.

## Technical notes

- `mkdocs.yml` nav gains an "8. Statistics" group; the Tutorials overview
  (`docs/workshops/index.md`) gains the new entry.
- The reference page `docs/statistics/overview.md` currently describes statistics
  sources as COG rasters only. It will be corrected to cover vector zonal-stats
  sources with `level`, matching what the builder actually accepts
  (FlatGeoBuf / GeoJSON).
- Docs rebuilt with `mkdocs build --strict`.
