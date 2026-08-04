# Add STAC collections as data sources

## Goal
Allow a STAC collection itself to be added to a layer as one data source. Newly created entries will use the canonical format value `"stac"` and the collection URL, with optional `assets`, `minZoom`, and `maxZoom` properties.

## User experience
- Add **STAC Collection** to the data-format choices for direct URL entry.
- In the existing STAC catalogue browser, give each collection an **Add collection** action alongside **Browse items**.
- When a collection is selected, populate the data-source form with its canonical/self collection URL and `format: "stac"` rather than resolving an individual asset URL.
- For STAC data sources, show optional controls for:
  - asset names as a repeatable list
  - minimum zoom
  - maximum zoom
- Preserve existing STAC browsing and individual asset selection unchanged.
- When editing an older entry using `"STAC-collection"`, present it as STAC and save it using the canonical `"stac"` value.

## Data and validation
- Add `stac` to the data-source format type and format configuration.
- Add `assets?: string[]` to the data-source TypeScript interface and Zod schema.
- Keep `minZoom`, `maxZoom`, and existing `style` support; these fields already pass through validation and export.
- Ensure the form initializes, edits, and saves all STAC-specific fields without dropping them in `useValidatedConfig` or JSON export.
- Treat `assets` as asset **names/keys**, not resolved asset URLs.

## Technical approach
- Extend the STAC browser selection contract with a separate collection selection shape containing the collection URL and identity.
- Resolve collection URLs from their `self` link where available, with the known collection endpoint as fallback for API and static catalogues.
- Route collection selections through the service-selection modal into `DataSourceForm`, while retaining the current asset-selection contract.
- Add focused form helpers/components only where needed; do not refactor the existing STAC browser architecture.

## Verification
- Add schema tests covering STAC entries with assets, zoom bounds, and style passthrough.
- Add focused tests for collection URL resolution/selection and canonical `stac` output, including legacy `STAC-collection` edit compatibility.
- Verify direct entry, catalogue collection selection, editing, validation, and exported JSON against the supplied examples.