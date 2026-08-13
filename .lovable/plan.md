# CLMS WMTS catalogue as a single recommended service

## Goal

Rather than adding 34 separate Copernicus Land Monitoring Service (CLMS) WMTS
endpoints to the recommended list, treat your generated
`cdse_layer_availability.json` as **one** recommended service — "CLMS WMTS
Services". The user adds it once, and then browses into it (datasets → layers)
in the same way the STAC browser drills into collections → items.

## How it works for the user

1. **Services → Add Recommended Services** now shows a single new entry,
   `Copernicus Land Monitoring (CLMS) WMTS`, badged as a catalogue.
2. Adding it stores one service in the config, pointing at the JSON catalogue
   URL. The service card shows dataset counts, e.g. "34 available / 27 unavailable".
3. In a Layer Card → **Datasets → Add Dataset → From Service**, picking the
   CLMS service opens a **catalogue browser**:
   - datasets grouped by theme parsed from the title (vegetation properties,
     water bodies, snow/ice, temperature, burnt area, land cover, ...),
   - a search box filtering on dataset identifier, title and layer names,
   - expanding a dataset lists its layers with title/abstract.
4. Selecting a layer creates a normal WMTS data source — `url` =
   `service_url`, `layers` = layer identifier — and runs the existing WMTS
   version negotiation so the `version` property is set as it is today. The
   resulting config contains a plain WMTS source; nothing catalogue-specific
   leaks into the exported config.

## Keeping the list fresh

The catalogue JSON lives in
`ESA-APEx/apex_geospatial_explorer_configs` (produced by your
`discover_cdse_layer_availability.sh`), referenced from the existing manifest,
so re-running the script and committing the output refreshes the list without
redeploying the builder. Unavailable datasets (`available: false`) are ignored
by the browser.

## Technical notes

- **Types**: extend `Service.sourceType` in `src/types/service.ts` with
  `'catalogue'`; add an optional `catalogue?: { datasets: CatalogueDataset[] }`
  shape to `ServiceCapabilities` (or a sibling type in
  `src/types/service.ts`) holding `datasetIdentifier`, `serviceUrl`, `title`,
  `abstract`, `theme`, `layers[]`.
- **Loader**: new `src/utils/catalogueService.ts` — fetches the JSON, validates
  the `catalogue` / `datasets` envelope, filters `available === true`, derives a
  theme from the pipe-delimited `title`, and maps to `ServiceCapabilities` with
  `totalCount` = layer count. Wired into `useServices.ts`,
  `useLazyServiceCapabilities.ts` and `useBulkServiceValidation.ts` alongside
  the existing `'stac'` branches so validation/healthcheck work unchanged.
- **Recommended manifest**: add a `catalogues` reference in
  `src/utils/exampleManifest.ts` (falling back gracefully when absent) and a
  `fetchRecommendedCatalogues()` in `src/utils/recommendedBaseLayers.ts`; merge
  the result into the list passed to `RecommendedServicesModal`, which gains a
  catalogue icon/badge. Deduping by URL still applies.
- **Browser UI**: new `src/components/layers/components/CatalogueBrowser.tsx`
  modelled on `StacBrowser` (accordion per theme, `min-w-0`/`truncate` on card
  content so long abstracts can't force horizontal scroll), hooked into
  `ServiceSelectionModals.tsx` where `service.sourceType === 'catalogue'`.
- **Card styling**: add catalogue colour/label branches to `ServiceCardList.tsx`
  and `ServicesManager.tsx` (a distinct accent, e.g. teal, with a `CATALOGUE`
  badge and "datasets" item noun).
- **Schema sync**: `sourceType` is validated in `src/schemas/configSchema.ts` —
  add `'catalogue'` there in the same change so services survive validation.
- **Docs**: new `docs/services/catalogues.md` plus a mention in
  `docs/services/recommended.md`; rebuild with `mkdocs build --strict`.

## Out of scope

- No changes to how WMTS data sources are exported or rendered.
- The discovery script itself stays in the configs repo; the builder only
  consumes its output.
