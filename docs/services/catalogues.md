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

## Styles and legends

Catalogue layers can carry a `styles` array. Each style names the source
evalscript and may include a `legend` describing the colours the service uses.
When present, the builder previews the legend in the catalogue browser and
auto-populates the layer's styling when the layer is added — but only when the
layer has no categories or colormaps of its own, so your own edits are never
overwritten.

Three outcomes are possible:

| Legend | Applied to the layer |
| --- | --- |
| `type: "discrete"` | **Categories** — one class per entry, using the entry `label` when given and the value otherwise. |
| `type: "continuous"` with a recognised `colormapName` (or colours matching a preset closely) | **Colormap** — the named ramp with `min`, `max`, `steps` and `reverse`. |
| `type: "continuous"` with a bespoke ramp | **Gradient** — `min`/`max` plus a two-stop start and end colour taken from the ramp. A bespoke ramp is never mislabelled as a preset. |

Entries listed under `noData` are excluded from both classes and the ramp, so
sentinel values such as `-1` do not distort the range. `units` populates the
layer's units when set.

```json
{
  "identifier": "BF",
  "title": "Burned fraction",
  "styles": [
    {
      "name": "burned_fraction.js",
      "evalscriptUrl": "https://raw.githubusercontent.com/.../burned_fraction.js",
      "legend": {
        "type": "continuous",
        "colormapName": "magma",
        "reverse": true,
        "min": 0,
        "max": 1,
        "steps": 20,
        "units": "fraction",
        "noData": [{ "value": -1, "color": "#FFFFFF" }],
        "entries": [
          { "value": 0, "color": "#FCFDBF" },
          { "value": 1, "color": "#000004" }
        ]
      }
    }
  ]
}
```

A dataset-level `style` block may also carry a `documentationUrl`, which the
browser links from the dataset card; each style's `evalscriptUrl` is linked from
the layer card. Both open in a new tab.

### Official legend graphics

Where the provider publishes an official legend image, the dataset's `style`
block carries it:

```json
"style": {
  "legendImage": {
    "source": "official-clms-cdse-legend",
    "pageUrl": "https://land.copernicus.eu/en/cdse-legends/clms_global_lst_5km_v1_hourly.png",
    "imageUrl": "https://land.copernicus.eu/en/cdse-legends/.../image-123-....png",
    "contentType": "image/png"
  }
}
```

The graphic is used only when there is no faithful translation to builder
styling — that is, when the layer has no legend, its legend was suppressed
during discovery, or the ramp would otherwise fall back to a two-stop gradient.
In those cases the catalogue browser shows a thumbnail of the graphic, and
adding the layer sets its legend to `{ "type": "image", "url": ... }` (unless the
layer already has a legend). Where categories or a named colormap were resolved,
those are kept and the graphic is not applied.


## Band metadata

Layers may also describe the band itself. The builder shows this beneath the
legend preview so you can judge whether the suggested styling suits your map.

| Field | Meaning |
| --- | --- |
| `units` | Concise unit, e.g. `mm/day`. Used for the layer's units when the legend has none. |
| `unitsRaw` | The original, verbose wording. Shown nowhere as a unit — it is a sentence, not a symbol. |
| `sourceFormat` | Storage type of the band, e.g. `INT16`. |
| `dataRange` | The physical range of the data. |
| `scale` / `offset` | Digital-number to physical-value conversion. |
| `bandMetadataSource` | Where the above came from; linked as "Band metadata". |
| `categoricalValueDescription` | Free-text summary of the classes for categorical bands. |

```json
{
  "identifier": "A_ET_ENSEMBLE",
  "units": "mm/day",
  "sourceFormat": "INT16",
  "scale": 0.1,
  "offset": 0,
  "dataRange": { "min": 0, "max": 20 },
  "bandMetadataSource": { "type": "official-cdse-bands-table", "url": "https://..." }
}
```

`scale` and `offset` are informational only — they are shown in the browser but
are not written into your configuration, because the explorer reads the values
the service already renders.

### Data range versus legend range

The legend's `min`/`max` is the *visualisation* range chosen by the evalscript,
which is often narrower than the band's physical `dataRange`. Where the two
differ, the browser says so — for example "Legend shows 0–10 of a 0–20 mm/day
data range" — so you can widen the colormap deliberately if you want to.

### Class labels and their provenance

Discrete legends may carry official class names, either per entry (`label`) or
summarised with `officialLabelCount`, alongside a `labelSource` naming the
document they came from. The browser reports partial coverage — "Categories: 23
classes (12 labelled)" — and links the source so you can complete the remaining
names by hand. Unlabelled classes fall back to their value and stay editable.

### Suppressed legends

A style may report `legendDiscovery` with `status: "suppressed"` when a legend
was found but judged untrustworthy — for instance an implausibly narrow parsed
range. In that case the builder shows the reason and links the evalscript
instead of inventing a misleading gradient.
