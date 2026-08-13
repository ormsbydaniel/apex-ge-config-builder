---
title: Catalogue services
---
# Catalogue services

A **catalogue** is a single service entry that points at a JSON file describing
many datasets and their map layers. Instead of adding dozens of individual WMTS
endpoints, you add one catalogue and browse into it (theme → dataset → layer)
when creating a data source.

The Copernicus Land Monitoring Service (CLMS) catalogue is available from
**Services → Add Recommended Services**, badged as `CATALOGUE`.

## Browsing a catalogue

In a Layer Card → **Datasets → Add Dataset → From Service**, pick the catalogue
service to open the catalogue browser:

1. **Themes** — datasets grouped by subject (vegetation properties, water
   bodies, snow and ice, temperature, burnt area, land cover, …). The catch-all
   **Other** group is always listed last.
2. **Datasets** — each dataset shows its identifier, abstract, service type
   badge (WMTS/WMS) and layer count.
3. **Layers** — add a single layer, or use **Add all** to add every layer in the
   dataset. Each selection becomes a normal WMTS/WMS data source; the service
   version is negotiated through GetCapabilities exactly as for a manually
   added service.

## Availability

Catalogue files list every candidate dataset, including those with no public
map service. A dataset is **selectable** only when it is marked available, has a
service URL, and exposes at least one layer.

Unavailable datasets are hidden by default. Turn on **Show unavailable** in the
browser header to see them; they appear greyed out with a short explanation:

- *No public map service; COG products catalogued only* — the data exists in the
  catalogue as Cloud Optimised GeoTIFFs, but no anonymous WMTS/WMS endpoint was
  found. You can still add the COGs manually if you have a public URL.
- *No public service endpoint found for this dataset* — nothing publicly
  reachable was discovered.

No GetCapabilities request is made for unavailable datasets.

## Catalogue file shape

Catalogue JSON uses a `meta` / `datasets` envelope. Only
`datasetIdentifier`, `title`, `theme` and `available` are required on a dataset;
`serviceUrl`, `getCapabilitiesUrl`, `serviceType`, `abstract` and `layers` are
present only where a public service was verified. An optional per-dataset
`access` block records what was checked (`wmts`, `wms`, `cog`), and
`meta.counts` carries the discovery summary used for the service card totals.

```json
{
  "meta": {
    "title": "Copernicus Land Monitoring Service (CDSE)",
    "counts": { "candidateCount": 115, "publiclyAvailableCount": 42 }
  },
  "datasets": [
    {
      "datasetIdentifier": "ba_global_300m_daily_v3",
      "title": "Burnt area, global, 300 m, daily",
      "theme": "Burnt area",
      "available": true,
      "serviceType": "WMTS",
      "serviceUrl": "https://land.copernicus.eu/cdse/ba_global_300m_daily_v3/",
      "getCapabilitiesUrl": "https://land.copernicus.eu/cdse/ba_global_300m_daily_v3/?SERVICE=WMTS&REQUEST=GetCapabilities",
      "layers": [{ "identifier": "day_of_burn", "title": "Burn Scar" }],
      "access": { "wmts": { "available": true } }
    }
  ]
}
```

Because the file is fetched at runtime from the configs repository,
regenerating and committing it refreshes the dataset list without redeploying
the builder.
