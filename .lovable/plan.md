# Getting the CLMS catalogue to appear

You are right: nothing will show yet. The app only discovers catalogues through the remote manifest in `ESA-APEx/apex_geospatial_explorer_configs`, and there is currently no `recommended.catalogues` entry and no CLMS JSON file hosted there. There is also no way to add a catalogue by hand in the UI today.

## What you need to do in the configs repo

1. Publish the CLMS layer list produced by your bash script as a JSON file, e.g. `config-builder/catalogues/clms-wmts.json`, on the `main` branch.
2. Add a `catalogues` array to `recommended` in `config-builder/manifest.json`:

```json
{
  "examples": [ ... ],
  "recommended": {
    "basemaps": { "file": "recommended-basemaps.json" },
    "services": { "file": "recommended-services.json" },
    "catalogues": [
      {
        "id": "clms",
        "name": "Copernicus Land Monitoring Service",
        "description": "CLMS WMTS layers grouped by theme",
        "file": "catalogues/clms-wmts.json"
      }
    ]
  }
}
```

`file` is resolved relative to `config-builder/`; an absolute `url` also works.

## Required shape of the catalogue JSON

The app reads it as a *catalogue collection* (a flat `datasets` array — not a manifest-of-manifests):

```json
{
  "meta": {
    "title": "Copernicus Land Monitoring Service",
    "description": "Generated from CLMS WMTS capabilities",
    "generated": "2026-08-13"
  },
  "datasets": [
    {
      "datasetIdentifier": "clms-hrl-imperviousness",
      "title": "Imperviousness Density 2018",
      "abstract": "Optional description",
      "theme": "Land Cover",
      "serviceUrl": "https://.../wmts",
      "getCapabilitiesUrl": "https://.../wmts?service=WMTS&request=GetCapabilities",
      "available": true,
      "layers": [
        { "identifier": "IMD_2018_010m", "title": "Imperviousness 2018 10m" }
      ]
    }
  ]
}
```

Notes:
- `theme` drives the grouping in the catalogue browser; missing values fall back to "Other".
- `available: false` datasets still render, greyed out with a "Service unavailable" badge — useful for the CLMS entries your script found but could not reach.
- `serviceUrl` + layer `identifier` become the data source URL and layer name when a layer is added; WMS/WMTS versions are negotiated at that point.

## Once published

In the builder: **Services → Add recommended services** — the CLMS catalogue appears alongside the recommended services and can be selected. After adding, its datasets/themes are browsable from the layer data-source picker.

## Optional app-side changes (say if you want these)

- **Manual catalogue entry** — add "Catalogue" to the service type dropdown in the Services manager so a catalogue JSON URL can be pasted directly (useful for testing before publishing to the repo). Currently `SourceConfigType` covers only OGC formats plus S3.
- **Cache refresh** — the manifest is cached per session (`clearExampleManifestCache`); a "Refresh" affordance would avoid a hard reload while iterating on the JSON.
- **Script output alignment** — if it helps, I can write a small converter/spec so your bash script emits exactly the schema above.

## Technical detail

- Manifest parsing: `src/utils/exampleManifest.ts` (`recommended.catalogues`, `parseCatalogueEntry`).
- Fetch/validation: `src/utils/catalogueService.ts` (`fetchCatalogueCollection`, `buildCatalogueCapabilities`), `src/hooks/useServices.ts`, `src/hooks/useBulkServiceValidation.ts`.
- UI: `src/components/ServicesManager.tsx`, `src/components/RecommendedServicesModal.tsx`, `src/components/layers/components/CatalogueBrowser.tsx`.
- Hosting must be CORS-readable; `raw.githubusercontent.com` is fine.
