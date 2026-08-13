# Support the revised CLMS catalogue schema

The new `clms-public-layers.json` keeps the same `{ meta, datasets }` envelope, but
several fields the builder currently assumes are always present are now optional.
Without changes, the catalogue browser will crash or mis-render on the 73
datasets that have no WMTS service.

## What changed in the file

- 115 datasets (was 61): 42 available WMTS, 73 unavailable.
- Unavailable datasets omit `serviceUrl`, `getCapabilitiesUrl`, `layers`, `abstract`
  and `serviceType` entirely — only `datasetIdentifier`, `title`, `theme`,
  `available` and `access` are present.
- New per-dataset `serviceType` (currently always `WMTS` when present).
- New per-dataset `access` block: `wmts`/`wms` (`available`, `getCapabilitiesUrl`)
  and `cog` (`catalogueAvailable`, `publicAvailable`, `productCount`).
- New `meta.counts` summary (candidate/public/wmts/wms/cog counts).
- 44 datasets fall into theme `Other`; titles of unavailable datasets are raw
  de-underscored identifiers rather than service titles.

## Changes needed

1. **Types** — make `serviceUrl`, `getCapabilitiesUrl` and `layers` optional on
   `CatalogueDataset`; add optional `serviceType` and `access`
   (`wmts`/`wms`/`cog` sub-objects). Add optional `counts` to the collection meta.
2. **Loader** (`src/utils/catalogueService.ts`) — normalise on load: default
   `layers` to `[]`, derive `serviceUrl`/`getCapabilitiesUrl` from `access.wmts`
   when the top-level fields are absent, and treat a dataset as selectable only
   when `available === true` and it has at least one layer. Extend
   `buildCatalogueCapabilities` to use `meta.counts` when present.
3. **Browser** (`CatalogueBrowser.tsx`) — guard every `dataset.layers.length` /
   `.map` against undefined, and for datasets with no layers show a short reason
   line instead of an empty layer list ("No public map service; COG products
   catalogued only" when `access.cog.catalogueAvailable` is true, otherwise
   "No public service endpoint found").
4. **Theme grouping** — sort the `Other` group last instead of alphabetically so
   the 44 unclassified datasets don't dominate the top of the list.
5. **Format from `serviceType`** — use the dataset's `serviceType` (lower-cased)
   for the created data source format instead of always defaulting to `wmts`,
   falling back to the existing default when absent.
6. **Docs** — update `docs/services/catalogues.md` (and the recommended-services
   page) to describe availability, `access`, and why some datasets are listed but
   not selectable.

## Out of scope

- No change to exported config shape; a selected layer still becomes a plain
  WMTS data source.
- No COG ingestion from the `access.cog` block — it is informational only for now.
