# Tutorial 12: STAC as a data source

A new tutorial that loads the prepared **STAC datasets** configuration and walks
through inspecting STAC data sources and how they behave in the Geospatial
Explorer. No layer building — inspection and understanding only.

## Structure (mirrors Tutorials 9–11)

New folder `docs/workshops/12-stac-data/`:

- `index.md` — "12. STAC as a data source" with objectives and step list
- `01-prerequisites.md` — core links (Tutorials 1–3), load via
  **Load → Examples → Test & development → STAC datasets**, export reminder
- `02-key-concepts.md` — what STAC is; catalogue → collection → item → asset;
  the config stores only the items/search URL plus asset name and format;
  items vs search endpoints; filters (bbox, datetime, limit, property filters)
  live in the URL
- `03-inspecting-stac-data-sources.md` — the main exercise
- `04-stac-in-the-preview.md` — behaviour exercise

## Exercise 12-3: Inspecting STAC data sources

Using the loaded STAC datasets config:

- Recognise STAC rows on a layer card: the `stac` format badge and the
  right-aligned asset badge (e.g. `data (flatgeobuf)`, `asset (cog)`).
- Open the **(i) STAC metadata** dialog on a row and tour its tabs:
  - **Collection** — title, description, licence, extents.
  - **Item** — the single item, or first item matching the filters, with date,
    extent and properties.
  - **Asset** — details for the selected asset, with the button that opens the
    COG or FlatGeoBuf file inspector.
  - **Queryables** — the properties the collection allows filtering on.
- Compare the layer types in the config: a whole collection (STAC Tillage
  simple), a single item (Austria LST STAC item), an item list with a datetime
  filter (Africa January 2023), a bounded query (Morocco time series), and a
  search-endpoint query with a property filter (Sentinel 2 STAC Query —
  June 2026, `cloud_cover < 10`).
- Open the query editor on one layer to see how AOI, TOI, limit and property
  filters appear as badges, and how the **Items / Search** query-method choice
  and **Test** button work (including that some servers only evaluate property
  filters on the search endpoint).

## Exercise 12-4: STAC in the preview

- Preview the config and observe how STAC layers render like any other layer.
- Use the time slider on a STAC time series (e.g. Austria LST items, or the
  East Belgium CHIME series) — each item's own datetime drives the timeline.
- Try the swipe comparison on the "Swipe test" layer (two dated Africa
  datasets).
- Note that multi-band styling and vector styling work on STAC assets exactly
  as on direct COG/FlatGeoBuf files (link back to Tutorials 9 and 10).

## Housekeeping

- Register the four pages in `mkdocs.yml` and keep
  `docs/javascripts/nav-groups.js` in sync.
- Screenshots: a small set of contextual shots (STAC badges on a layer card,
  the metadata dialog tabs, the query editor) taken in first-encounter order,
  added via `scripts/add-screenshot.sh` to both screenshot locations, sized by
  aspect ratio per the established convention.
- Rebuild the guide with `mkdocs build --strict`. Not published until asked.

## Notes

- The STAC datasets config currently lives in the **Test & development** group
  of the Examples tab; the prerequisite instructions will say so. If you'd
  rather promote it to the main Examples list, that's a one-line manifest
  change in the configs repo (separate, optional).
- Content will be drafted for your review before any screenshots are taken.
