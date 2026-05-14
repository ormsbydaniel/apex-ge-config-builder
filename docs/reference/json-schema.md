---
title: JSON schema reference
---

# JSON schema reference

This page documents the underlying JSON structure of an APEx Geospatial
Explorer configuration — the document you see in the
[JSON Config tab](../configuration/json-config.md) and that gets written
out by **Home → Export**.

It is derived from the Zod schema in
[`src/schemas/configSchema.ts`](https://github.com/) and uses excerpts from the
**Comprehensive demo** (`/examples/test-config.json`) for every section.
Load that example from **Home → Load → Examples → Comprehensive demo** if
you'd like to follow along in the editor.

!!! note "Conventions"
    - "Required" means the schema rejects the document if the field is missing.
    - Most object shapes are `passthrough` — extra properties are preserved on import/export, so you can hand-edit advanced keys (e.g. raster `style`, `env`, `time`) that aren't surfaced in the UI yet.
    - URLs accept absolute (`https://…`) or repo-relative (`/`, `./`, `../`) paths.

## Top-level structure

Every configuration is a single JSON object with this shape:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `version` | string | no | Free-form version label, surfaced on the Home tab. |
| `exportPrefix` | string | no | Filename prefix used by **Export** (default `apex-config`). |
| `layout` | object | yes | Branding, design variant, theme, footer. |
| `interfaceGroups` | string[] | yes | User-facing group names that layers can be assigned to. |
| `exclusivitySets` | string[] | yes | Named sets — only one layer per set can be on at a time. |
| `services` | object[] | no | Reusable endpoint definitions referenced by layers. Defaults to `[]`. |
| `sources` | object[] | yes | All map layers (base layers, layer cards, swipe / comparison layers). |
| `mapConstraints` | object | no | Initial zoom, centre, and CRS. |
| `projections` | object[] | no | Custom proj4 [Coordinate Reference System](../settings/index.md) definitions. |

Skeleton:

```json
{
  "version": "3.3.5.1",
  "exportPrefix": "apex-config",
  "layout": { "navigation": { … }, "design": { … }, "theme": { … } },
  "interfaceGroups": ["Soils", "Land Cover", "…"],
  "exclusivitySets": ["basemaps", "labels"],
  "services": [ … ],
  "sources": [ … ],
  "mapConstraints": { "zoom": 4, "center": [-0.163, 51.5], "projection": "EPSG:3857" },
  "projections": [ … ]
}
```

## `layout`

Top-level branding and chrome. Edited from the
[Settings tab](../settings/index.md).

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `navigation.logo` | URL or path | yes | Logo shown in the top bar. |
| `navigation.title` | string | yes | Application title (non-empty). |
| `design.variant` | string | no | UI variant id — see [Global layout design](../configuration/layout.md). |
| `design.parameters` | object | no | Variant-specific parameters (e.g. `{ "position": "right" }`). |
| `theme` | object | no | Colour tokens (see below). |
| `footer` | FooterLink[] | no | Links rendered in the GE footer. Each item is `{ "title": "…", "url": "…" }`. |

Theme keys (all optional, all CSS colour strings):

`primary-color`, `secondary-color`, `tertiary-color`, `accent-color`,
`background-color`, `foreground-color`, `text-color-primary`,
`text-color-secondary`, `disabled-color`, `border-color`, `success-color`,
`text-color-on-success`, `error-color`, `text-color-on-error`,
`warning-color`, `text-color-on-warning`.

```json
"layout": {
  "design": { "variant": "standard", "parameters": { "position": "right" } },
  "navigation": {
    "logo": "https://www.esa.int/extension/pillars/design/pillars/images/ESA_Logo.svg",
    "title": "APEx Geospatial Explorer Demonstrator"
  },
  "theme": {
    "primary-color": "#1a3a5c",
    "background-color": "#ffffff",
    "text-color-primary": "#1a1a1a"
  }
}
```

## `interfaceGroups` and `exclusivitySets`

Both are plain arrays of strings.

- **`interfaceGroups`** define the top-level groupings in the GE layer panel. Each layer's `layout.interfaceGroup` must reference one of these. Managed from [Settings → Interface Groups](../configuration/interface-groups.md).
- **`exclusivitySets`** define mutual-exclusion groups (e.g. "only one basemap on at a time"). A layer joins a set via its `exclusivitySets` field.

```json
"interfaceGroups": ["Soils", "Biodiversity & Ecosystem Accounting", "Land Cover", "Vegetation", "Energy", "Cities"],
"exclusivitySets": ["labels", "basemaps", "worldcover"]
```

## `services[]`

A reusable endpoint definition. Layers reference services by `serviceId`,
so swapping a URL in one place updates every layer that uses it. See the
[Services tab](../services/index.md).

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | yes | Stable identifier — referenced from `data[].serviceId`. |
| `name` | string | yes | Human-readable label shown in dropdowns. |
| `url` | URL or path | yes | Endpoint URL (or root URL for S3 / STAC). |
| `sourceType` | enum | no | `s3`, `service`, `stac`. |
| `format` | enum | no | `wms`, `wmts`, `xyz`, `wfs`, `cog`, `geojson`, `flatgeobuf`, `csv`, `s3`, `stac`. |
| `capabilities` | object | no | Cached `GetCapabilities` / catalogue metadata (auto-populated). |

```json
"services": [
  { "id": "wmts-service-1750331396152", "name": "Terrascope WMTS",
    "url": "https://globalland.vito.be/wmts", "format": "wmts" },
  { "id": "stac-service-1758796621711", "name": "Project Results Repository",
    "url": "https://eoresults.esa.int/stac", "format": "stac" },
  { "id": "s3-service-1750499655684", "name": "Sparkgeo ESA Apex S3 bucket",
    "url": "https://esa-apex.s3.eu-west-1.amazonaws.com/", "format": "cog" }
]
```

## `sources[]` — the layer model

Every map layer lives in `sources`. The schema is a discriminated union of
five variants, distinguished by a few flag fields:

| Variant | Identified by | Required fields |
|---------|---------------|-----------------|
| **Base layer** | `isBaseLayer: true` | `meta`, `layout` optional |
| **Layer card** | (none of the flags below) | `meta`, `layout` required |
| **Swipe layer** | `meta.swipeConfig` present | `meta`, `layout` required |
| **Comparison layer** | one of `isSwipeLayer`, `isMirrorLayer`, `isSpotlightLayer` `= true` | `meta`, `layout` required |
| Flexible fallback | — | accepts older configs while migrating |

Common fields on every variant:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | yes | Display name in the layer panel. |
| `isActive` | boolean | yes | Whether the layer starts toggled on. |
| `data` | DataSourceItem[] | yes | One or more renderable items (see below). |
| `statistics` | DataSourceItem[] | no | Companion statistics layers (e.g. NUTS-aggregated FlatGeoBuf). |
| `constraints` | object[] | no | Interactive constraint sources — see `constraints[]`. |
| `workflows` | object[] | no | openEO / processing-graph hooks — see `workflows[]`. |
| `charts` | object[] | no | Inline charts — see `charts[]`. |
| `exclusivitySets` | string[] | no | Names from the top-level `exclusivitySets`. |
| `isBaseLayer` | boolean | no | Marks the variant as a base layer. |
| `isSwipeLayer` / `isMirrorLayer` / `isSpotlightLayer` | boolean | no | At most one may be `true`. |
| `timeframe` / `defaultTimestamp` | enum / number | no | Temporal config — see [Time Precision](../layers/index.md). |
| `hasFeatureStatistics` | boolean | no | Hint for vector-feature stats. |

Base layer example:

```json
{
  "name": "Stadia Alidade Smooth Dark",
  "isActive": true,
  "isBaseLayer": true,
  "data": [
    { "url": "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}@2x.png",
      "format": "xyz", "zIndex": 10 }
  ],
  "meta": {
    "description": "",
    "attribution": { "text": "© Stadia Maps © OpenMapTiles © OpenStreetMap",
                     "url": "https://stadiamaps.com/" }
  }
}
```

Swipe / comparison layer example (note `position` on each `data` item and
`isSwipeLayer: true`):

```json
{
  "name": "Greece Level 1 Habitat Map 2020 vs S2",
  "isActive": false,
  "isSwipeLayer": true,
  "data": [
    { "url": "https://eoresults.esa.int/…/GR_L1_pp_2020.tif",
      "format": "cog", "zIndex": 50, "position": "right" },
    { "url": "https://services.terrascope.be/wms/v2",
      "format": "wms", "zIndex": 50, "layers": "WORLDCOVER_2021_S2_TCC",
      "position": "left" }
  ],
  "meta": { "…": "…", "swipeConfig": { "clippedSourceName": "GR_L1_pp_2020", "baseSourceNames": ["WORLDCOVER_2021_S2_TCC"] } },
  "layout": { "…": "…" }
}
```

## `data[]` and `statistics[]` — DataSourceItem

Each item describes one renderable thing on the map. Either `url` or a
non-empty `images[]` array must be provided.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `url` | URL or path | one of `url` / `images` | Endpoint or tile template. |
| `images` | `[{ url }]` | one of `url` / `images` | Multi-image COG sets. |
| `format` | string | yes | Source format: `wms`, `wmts`, `xyz`, `wfs`, `cog`, `geojson`, `flatgeobuf`, `csv`. |
| `zIndex` | number | yes | Stacking order (higher draws on top). |
| `serviceId` | string | no | Link to a `services[].id` to inherit the URL. |
| `layers` | string | no | OGC layer name (WMS/WMTS/WFS). |
| `level` | number | no | Statistics level (NUTS, admin level, etc.). |
| `style` | object | no | Renderer-specific style (e.g. OpenLayers style spec for COG / vectors). |
| `position` | enum | no | `left`, `right`, `background`, `spotlight` for comparison layers. |
| `minZoom` / `maxZoom` | number | no | Visibility window. |
| `timestamps` | number[] | no | Unix epochs for temporal data items. |
| `opacity` | number 0–1 | no | Per-item opacity. |
| `normalize` | boolean | no | Hint for COG renderers. |
| `type` | string | no | Renderer hint. |
| `isBaseLayer` | boolean | no | Legacy migration aid only. |

The schema is `passthrough`, so extra keys you set by hand (e.g. `env`,
`time`, `transparent`, `styles`) survive round-trips.

```json
"data": [
  { "url": "https://eoresults.esa.int/…/europe_aggr-orgc_00-020_mean_100_201803-202010.tif",
    "format": "cog", "zIndex": 50, "timestamps": [1583020800] },
  { "url": "https://eoresults.esa.int/…/europe_aggr-orgc_00-020_mean_100_201903-202110.tif",
    "format": "cog", "zIndex": 50, "timestamps": [1614556800] }
]
```

## `meta`

Layer metadata: how it is described, attributed, coloured, and bounded.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `description` | string | yes | Markdown-friendly description, shown in the info panel. |
| `attribution.text` | string | yes | Attribution string displayed on the map. |
| `attribution.url` | string | no | Link target for the attribution. |
| `categories[]` | object | no | `{ color, label, value? }` — categorical legend entries. |
| `colormaps[]` | object | no | `{ name, min, max, steps, reverse }` — continuous colour ramps. |
| `units` | string | no | Display units (e.g. `dg kg^(-1)`). |
| `min` / `max` | number | no | Range used by gradient legends without a colormap. |
| `startColor` / `endColor` | string | no | Gradient endpoints (must be non-empty if no colormap). |
| `swipeConfig` | object | required for swipe layers | `{ clippedSourceName, baseSourceNames[] }`. |
| `temporal` | object | no | `{ timeframe: 'None'\|'Time'\|'Days'\|'Months'\|'Years', defaultTimestamp? }`. |
| `fields` | record | no | Per-attribute display config for vector layers — see below. |

Continuous raster with a colormap:

```json
"meta": {
  "description": "Soil Organic Carbon content in the 0–20 cm top soil…",
  "attribution": { "text": "World Soils", "url": "https://world-soils.com/" },
  "units": "dg kg^(-1)",
  "min": 0, "max": 1800,
  "colormaps": [
    { "name": "copper", "min": 0, "max": 1800, "steps": 50, "reverse": true }
  ]
}
```

Categorical raster:

```json
"meta": {
  "description": "Natural ecosystem types in 2020…",
  "attribution": { "text": "ESA People Ecosystem Accounting" },
  "categories": [
    { "color": "#4001ed", "label": "Marine benthic habitats (MA-MG)", "value": 10000 },
    { "color": "#44caee", "label": "Coastal habitats", "value": 40000 },
    { "color": "#dbe341", "label": "Grasslands", "value": 60000 }
  ]
}
```

Vector layer with field display config (`null` hides a field):

```json
"meta": {
  "description": "NUTS regions",
  "attribution": { "text": "Eurostat" },
  "fields": {
    "NUTS_NAME":  { "label": "Region",       "order": 1 },
    "AREA_KM2":   { "label": "Area",         "suffix": " km²", "precision": 1, "order": 2 },
    "OBJECTID":   null
  }
}
```

## `layout` (per-source)

Where the layer lives in the GE UI and how its legend / controls render.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `interfaceGroup` | string | no | Must match a top-level `interfaceGroups` entry. |
| `subinterfaceGroup` | string | no | Optional second-level grouping. |
| `contentLocation` | enum | no | `layerCard` or `infoPanel` — where legend/controls render. |
| `layerCard` | object | yes | Always required. Holds `toggleable` (always here), and `legend` / `controls` / `showStatistics` when `contentLocation === 'layerCard'`. |
| `infoPanel` | object | no | Holds `legend` / `controls` when `contentLocation === 'infoPanel'`. |

**Constraint:** legend and controls cannot live in both `layerCard` and
`infoPanel` at the same time.

`legend` shape:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `type` | enum | yes | `swatch`, `gradient`, or `image`. |
| `url` | string | required when `type: image` | Image URL. |

`controls` shape (object form; an array-of-strings legacy form is also accepted):

`opacitySlider`, `zoomToCenter`, `temporalControls`, `constraintSlider`,
`blendControls` (booleans), and `download` (string URL).

```json
"layout": {
  "interfaceGroup": "Soils",
  "subinterfaceGroup": "World Soils",
  "contentLocation": "infoPanel",
  "layerCard": { "toggleable": true },
  "infoPanel": {
    "legend": { "type": "gradient" },
    "controls": {
      "opacitySlider": true,
      "zoomToCenter": true,
      "download": "https://browser.apex.esa.int/external/eoresults.esa.int/stac/collections/worldsoils-soc",
      "temporalControls": true,
      "constraintSlider": true,
      "blendControls": true
    }
  }
}
```

## `constraints[]`

Interactive COG-based constraints — see [Constraints](../constraints/index.md).

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `url` | URL or path | yes | COG to read. |
| `format` | const | yes | Always `"cog"`. |
| `label` | string | yes | Display name. |
| `type` | enum | yes | `continuous`, `categorical`, or `combined`. |
| `interactive` | boolean | yes | Whether the user can change the threshold/selection. |
| `min` / `max` / `units` | — | required when `type: continuous` | Numeric range. |
| `constrainTo` | array | required when `type: categorical` or `combined` | Categorical: `[{ label, value }]`. Combined: `[{ label, min, max }]`. |
| `bandIndex` | integer | no | Which COG band to read. |

```json
"constraints": [
  {
    "url": "https://esa-apex.s3.eu-west-1.amazonaws.com/…-esa_worldcover_2021.tif",
    "format": "cog",
    "label": "Land Cover Types (from World Cover 2022)",
    "type": "categorical",
    "interactive": true,
    "bandIndex": 2,
    "constrainTo": [
      { "label": "Tree cover", "value": 10 },
      { "label": "Cropland",   "value": 40 },
      { "label": "Built-up",   "value": 50 }
    ]
  },
  {
    "url": "https://eoresults.esa.int/…/europe_aggr-orgc_00-020_uncertainty_100_202003-202210.tif",
    "format": "cog",
    "label": "Uncertainty",
    "type": "continuous",
    "interactive": true,
    "min": 1, "max": 100, "units": "index", "bandIndex": 3
  }
]
```

## `workflows[]`

Server-side processing hooks (e.g. openEO process graphs).

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `zIndex` | number | yes | Stacking order of the produced layer. |
| `service` | string | yes | Workflow identifier. |
| `label` | string | yes | UI label. |

Extra properties pass through unchanged.

```json
"workflows": [
  { "zIndex": 50, "service": "eurac_pv_farm_detection", "label": "PV farm detection" }
]
```

## `charts[]`

Inline charts attached to a layer — see [Charts](../charts/index.md).

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `chartType` | enum | no | `xy` or `pie`. |
| `title` / `subtitle` | string | no | Headers. |
| `x` | string or string[] | no | X-axis field(s). Omit for pie / pixel-value charts. |
| `traces[]` | object | no | Plotly-style trace objects (`y`, `name`, `type`, `mode`, `fill`, `line`, `marker`, …). |
| `layout` | object | no | Plotly layout (`height`, `legend`, `barmode`, `xaxis`, `yaxis`). |
| `pie` | object | no | Pie-only options (`labels`, `values`, `hole`, `textinfo`, `colors`). |
| `sources[]` | object | no | Where the data comes from: `{ type: 'externalURL'\|'lookupURL'\|'pixelValues'\|'inline', url?, field?, fields?, format?, label? }`. |

Schema example (a line chart fed by a remote CSV):

```json
"charts": [
  {
    "chartType": "xy",
    "title": "Soil Organic Carbon over time",
    "x": "date",
    "traces": [
      { "y": "mean", "name": "SOC mean", "type": "scatter", "mode": "lines+markers",
        "line": { "color": "#1a3a5c", "width": 2 } }
    ],
    "layout": { "height": 240, "showlegend": true,
                "xaxis": { "type": "date" },
                "yaxis": { "title": { "text": "g/kg" } } },
    "sources": [
      { "type": "externalURL",
        "url": "https://example.org/soc-timeseries.csv",
        "format": "csv" }
    ]
  }
]
```

## `mapConstraints`

Initial map view.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `zoom` | number 0–28 | yes | Initial zoom level. |
| `center` | `[lon, lat]` | yes | Two-element array. |
| `projection` | string | no | EPSG code, e.g. `EPSG:3857`. |

```json
"mapConstraints": { "zoom": 4, "center": [-0.163, 51.5], "projection": "EPSG:3857" }
```

## `projections[]`

Custom proj4 [Coordinate Reference System](../settings/index.md) definitions
made available to `mapConstraints.projection` and to the layer renderer.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `code` | string | yes | EPSG-style code (e.g. `EPSG:3035`). |
| `definition` | string | yes | proj4 definition string. |
| `name` | string | no | Friendly label. |

```json
"projections": [
  {
    "code": "EPSG:3035",
    "name": "ETRS89 / LAEA Europe",
    "definition": "+proj=laea +lat_0=52 +lon_0=10 +x_0=4321000 +y_0=3210000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"
  }
]
```

## See also

- [JSON Config tab](../configuration/json-config.md) — view, edit, and copy the live config.
- [Build your first config](../getting-started/first-config.md) — guided walk-through.
- [URL parameters](url-parameters.md) — runtime overrides applied on top of the saved config.
