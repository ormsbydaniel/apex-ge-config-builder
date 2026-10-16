# Writing an app template

The **Apps** page (`/apps`) offers ready-made app templates. Besides the built-in ones, anyone can contribute a template to the [ESA-APEx configs repository](https://github.com/ESA-APEx/apex_geospatial_explorer_configs). Contributed templates appear on the Apps page with a **Community** badge, with no new release of the Configuration Builder needed.

A template is two files in its own folder:

- `config.json`: a normal Geospatial Explorer configuration, built and styled in the Configuration Builder and exported. This is the **base config**.
- `wizard.json`: which questions the wizard asks, and where each answer goes in the base config.

Then list the template in `config-builder/manifest.json`:

```json
"appTemplates": [
  { "file": "apps/s2-monitor/wizard.json" }
]
```

## The template file

```json
{
  "formatVersion": 1,
  "id": "s2-monitor",
  "name": "Satellite STAC Monitor",
  "tagline": "Live satellite scenes from a STAC catalogue",
  "bestFor": ["Sentinel-2 archives", "Agriculture"],
  "baseConfig": "config.json",
  "defaults": { "title": "Satellite Monitor", "center": [-2.6, 51.45], "zoom": 11, "layoutVariant": "sidebar" },
  "steps": { "data": { "title": "…", "fields": [] }, "options": { "title": "…", "fields": [] } },
  "computed": {},
  "patches": []
}
```

The wizard always asks for the title, starting location and layout itself. Your template supplies the **Data** and **Options** steps.

### Questions (fields)

Each field has an `id`, a `label`, a `type` (`choice`, `date`, `text` or `slider`) and a `default`. Optional: `options` (for choices), `help`, `placeholder`, `min`/`max`/`step`/`unit` (sliders), and `showIf: { "field": "mission", "in": ["custom"] }` to show a field only for some answers.

### Values

Anywhere a value is needed you can write:

| Form | Meaning |
| --- | --- |
| `{ "value": 5 }` | A fixed value |
| `{ "from": "season" }` | An answer. Also `title`, `center`, `zoom`, `centerLon`, `centerLat`, `layoutVariant` |
| `{ "text": "{{name}} ({{start}})" }` | Text with answers or computed values filled in |
| `{ "map": "mission", "cases": { "a": "…" }, "default": { … } }` | Pick a value by answer |
| `{ "ref": "searchUrl" }` | A named value from `computed` |
| `{ "use": "slug", "args": { "text": { "from": "title" } } }` | A built-in helper |

### Patches

Patches change the base config, in order. Paths use JSON Pointer style (`/sources/1/data/0/url`); array positions are numbers. Every path must already exist in the base config.

```json
{ "set": "/layout/navigation/title", "from": "title" }
{ "remove": "/sources/1/data/0/style", "when": { "field": "imageAsset", "notIn": ["visual"] } }
```

`when` can check an answer or a computed value with `in` or `notIn`.

## Built-in helpers

Templates never contain code; they pick helpers by name.

| Where | Name | What it does |
| --- | --- | --- |
| Values | `slug` | Turns text into a file-name prefix |
| Values | `number` | Converts to a number |
| Values | `coalesce` | `a` unless empty, otherwise `b` |
| Values | `periodStart`, `periodEnd` | Dates from `season`, `year`, or custom `start`/`end` |
| Values | `stacSearchUrl` | STAC items URL from `collection`, `center`, `zoom`, `start`, `end`, `maxCloud`, `filterStyle` (`query` or `cql2`) |
| Values | `singleKeyObject`, `list` | Build `{ key: value }` or a list from args |
| `probe` | `stacCollection`, `wmsLayers`, `vectorExtent` | Read what the data offers from `url` |
| `liveCheck` | `stacSceneCount` | Count scenes for `url` on the Options step |
| Field `optionsFrom` | `extentYears`, `probeYears`, `wmsLayers` | Replace choices with what the probe found |
| Field `rangeFrom` | `temporalExtent` | Limit dates to the collection's range |

## Checks

When the Apps page loads, each template is checked: the format, helper names, and a trial build with the default answers. A template that fails is not shown as a card but is listed under **Unavailable templates** with the reason. Every generated app also goes through the same checks as loading a config file.

A complete example, the Satellite STAC Monitor, is in `apps/s2-monitor/` of the configs repository.
